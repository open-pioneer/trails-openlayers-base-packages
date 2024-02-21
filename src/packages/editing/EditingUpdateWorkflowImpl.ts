// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter, ManualPromise, createManualPromise } from "@open-pioneer/core";
import { MapModel, TOPMOST_LAYER_Z } from "@open-pioneer/map";
import { Modify, Select } from "ol/interaction";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { MapRegistry } from "@open-pioneer/map";
import { HttpService } from "@open-pioneer/http";
import { PackageIntl } from "@open-pioneer/runtime";
import { FlatStyleLike } from "ol/style/flat";
import GeoJSON from "ol/format/GeoJSON";
import GeoJSONGeometry from "ol/format/GeoJSON";
import GeoJSONGeometryCollection from "ol/format/GeoJSON";
import { saveUpdatedFeature } from "./UpdateFeaturesHandler";
import OlMap from "ol/Map";
import Overlay from "ol/Overlay";
import { Resource } from "@open-pioneer/core";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";
import { EditingWorkflowEvents, EditingWorkflowState, EditingWorkflow } from "./api";

// Represents a tooltip rendered on the OpenLayers map
interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
}

export class EditingUpdateWorkflowImpl
    extends EventEmitter<EditingWorkflowEvents>
    implements EditingWorkflow
{
    #waiter: ManualPromise<string | undefined> | undefined;

    private readonly _mapRegistry: MapRegistry;
    private _httpService: HttpService;
    private _intl: PackageIntl;

    private _map: MapModel;
    private _polygonDrawStyle: FlatStyleLike;
    private _state: EditingWorkflowState;
    private _editLayerURL: URL;

    private _editingSource: VectorSource;
    private _editingLayer: VectorLayer<VectorSource>;
    private _selectInteraction: Select;
    private _modifyInteraction: Modify;
    private _olMap: OlMap;
    private _mapContainer: HTMLElement | undefined;
    private _tooltip: Tooltip;
    private _escapeHandler: (e: KeyboardEvent) => void;

    private _interactionListener: Array<EventsKey>;
    private _mapListener: Array<Resource>;

    constructor(
        map: MapModel,
        ogcApiFeatureLayerUrl: URL,
        polygonDrawStyle: FlatStyleLike,
        httpService: HttpService,
        mapRegistry: MapRegistry,
        intl: PackageIntl
    ) {
        super();
        this._mapRegistry = mapRegistry;
        this._httpService = httpService;
        this._intl = intl;

        this._polygonDrawStyle = polygonDrawStyle;

        this._map = map;
        this._olMap = map.olMap;
        this._state = "active:initialized";
        this._editLayerURL = ogcApiFeatureLayerUrl;

        this._editingSource = new VectorSource();
        this._editingLayer = new VectorLayer({
            source: this._editingSource,
            zIndex: TOPMOST_LAYER_Z,
            properties: {
                name: "editing-layer"
            }
        });

        this._selectInteraction = new Select({});

        this._modifyInteraction = new Modify({
            features: this._selectInteraction.getFeatures(),
            style: this._polygonDrawStyle
        });

        this._tooltip = this._createTooltip(this._olMap);

        this._escapeHandler = (e: KeyboardEvent) => {
            if (e.code === "Escape" && e.target === this._olMap.getTargetElement()) {
                this.reset();
            }
        };

        this._interactionListener = [];
        this._mapListener = [];

        this._start();
    }

    getSelectInteraction() {
        return this._selectInteraction;
    }

    getModifyInteraction() {
        return this._modifyInteraction;
    }

    getState() {
        return this._state;
    }

    private _setState(state: EditingWorkflowState) {
        this._state = state;
        this.emit(state);
    }

    private _start() {
        this._olMap.addLayer(this._editingLayer);
        this._olMap.addInteraction(this._selectInteraction);
        this._olMap.addInteraction(this._modifyInteraction);

        // Add EventListener on focused map to abort actual interaction via `Escape`
        this._mapContainer = this._olMap.getTargetElement() ?? undefined;
        if (this._mapContainer) {
            this._mapContainer.addEventListener("keydown", this._escapeHandler, false);
        }

        this._tooltip.element.classList.remove("hidden");

        const modify = this._modifyInteraction.on("modifystart", () => {
            this._setState("active:drawing");

            this._tooltip.element.textContent = this._intl.formatMessage({
                id: "update.tooltip.modified"
            });
        });

        const select = this._selectInteraction.on("select", (e) => {
            if (e.selected.length === 1 && e.deselected.length === 0) {
                this._tooltip.element.textContent = this._intl.formatMessage({
                    id: "update.tooltip.deselect"
                });
            } else if (e.selected.length === 0 && e.deselected.length === 1) {
                if (this._state === "active:initialized") {
                    this._tooltip.element.textContent = this._intl.formatMessage({
                        id: "update.tooltip.select"
                    });
                } else if (this._state === "active:drawing") {
                    // TODO: Zurücksetzen der Geometrie bei "".reset()""

                    const layerUrl = this._editLayerURL;

                    this._setState("active:saving");

                    const geometry = e.deselected[0]?.getGeometry();
                    console.log(e.deselected[0]?.getProperties());
                    if (!geometry) {
                        this._destroy();
                        this.#waiter?.reject(new Error("no geometry available"));
                        return;
                    }
                    const projection = this._olMap.getView().getProjection();
                    const geoJson = new GeoJSON({
                        dataProjection: projection
                    });
                    const geoJSONGeometry: GeoJSONGeometry | GeoJSONGeometryCollection =
                        geoJson.writeGeometryObject(geometry, {
                            rightHanded: true,
                            decimals: 10
                        });

                    saveUpdatedFeature(this._httpService, layerUrl, geoJSONGeometry, projection)
                        .then((featureId) => {
                            this._destroy();
                            this.#waiter?.resolve(featureId);
                        })
                        .catch((err: Error) => {
                            this._destroy();
                            this.#waiter?.reject(err);
                        });
                }
            } else if (
                e.selected.length === 1 &&
                e.deselected.length === 1 &&
                this._state === "active:initialized"
            ) {
                console.log("----");
            }

            // TODO: Prüfen, mehrere Vektorlayer new Select
        });

        // update event handler when container changes
        const changedContainer = this._map.on("changed:container", () => {
            this._mapContainer?.removeEventListener("keydown", this._escapeHandler);

            this._mapContainer = this._olMap.getTargetElement() ?? undefined;
            if (this._mapContainer) {
                this._mapContainer.addEventListener("keydown", this._escapeHandler, false);
            }
        });

        this._interactionListener.push(modify, select);
        this._mapListener.push(changedContainer);
    }

    reset() {
        const selectedFeatures = this._selectInteraction.getFeatures();
        if (selectedFeatures.getLength() > 0) {
            this._selectInteraction.getFeatures().remove(selectedFeatures.item(0));
        }

        this._tooltip.element.textContent = this._intl.formatMessage({
            id: "update.tooltip.select"
        });
        this._setState("active:initialized");
    }

    stop() {
        this._destroy();
        this.#waiter?.resolve(undefined);
    }

    // TODO: Cancel request
    private _destroy() {
        this._olMap.removeLayer(this._editingLayer);
        this._olMap.removeInteraction(this._selectInteraction);
        this._olMap.removeInteraction(this._modifyInteraction);
        this._tooltip.destroy();

        // Remove event listener on interaction and on map
        this._interactionListener.map((listener) => {
            unByKey(listener);
        });
        this._mapListener.map((listener) => {
            listener.destroy();
        });

        // Remove event escape listener
        this._mapContainer?.removeEventListener("keydown", this._escapeHandler);

        this._state = "inactive";
    }

    whenComplete(): Promise<string | undefined> {
        const manualPromise = (this.#waiter ??= createManualPromise());
        return manualPromise.promise;
    }

    private _createTooltip(olMap: OlMap): Tooltip {
        const element = document.createElement("div");
        element.className = "editing-tooltip hidden";
        element.textContent = this._intl.formatMessage({ id: "update.tooltip.select" });

        const overlay = new Overlay({
            element: element,
            offset: [15, 0],
            positioning: "center-left"
        });

        const pointerMove = olMap.on("pointermove", (evt) => {
            if (evt.dragging) {
                return;
            }

            overlay.setPosition(evt.coordinate);
        });

        olMap.addOverlay(overlay);

        return {
            overlay,
            element,
            destroy() {
                unByKey(pointerMove);
                olMap.removeOverlay(overlay);
            }
        };
    }
}
