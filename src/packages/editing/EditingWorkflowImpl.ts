// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter, ManualPromise, createManualPromise } from "@open-pioneer/core";
import { MapModel, TOPMOST_LAYER_Z } from "@open-pioneer/map";
import { Draw } from "ol/interaction";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { MapRegistry } from "@open-pioneer/map";
import { HttpService } from "@open-pioneer/http";
import { PackageIntl } from "@open-pioneer/runtime";
import { FlatStyleLike } from "ol/style/flat";
import GeoJSON from "ol/format/GeoJSON";
import GeoJSONGeometry from "ol/format/GeoJSON";
import GeoJSONGeometryCollection from "ol/format/GeoJSON";
import { saveCreatedFeature } from "./SaveFeaturesHandler";
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

export class EditingWorkflowImpl
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

    private _drawSource: VectorSource;
    private _drawLayer: VectorLayer<VectorSource>;
    private _drawInteraction: Draw;
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

        this._drawSource = new VectorSource();
        this._drawLayer = new VectorLayer({
            source: this._drawSource,
            zIndex: TOPMOST_LAYER_Z,
            properties: {
                name: "editing-layer"
            }
        });

        this._drawInteraction = new Draw({
            source: this._drawSource,
            type: "Polygon",
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

    getDrawInteraction() {
        return this._drawInteraction;
    }

    getState() {
        return this._state;
    }

    private _setState(state: EditingWorkflowState) {
        this._state = state;
        this.emit(state);
    }

    private _start() {
        this._olMap.addLayer(this._drawLayer);
        this._olMap.addInteraction(this._drawInteraction);

        // Add EventListener on focused map to abort actual interaction via `Escape`
        this._mapContainer = this._olMap.getTargetElement() ?? undefined;
        if (this._mapContainer) {
            this._mapContainer.addEventListener("keydown", this._escapeHandler, false);
        }

        this._tooltip.element.classList.remove("hidden");

        const drawStart = this._drawInteraction.on("drawstart", () => {
            this._setState("active:drawing");
            this._tooltip.element.textContent = this._intl.formatMessage({
                id: "tooltip.continue"
            });
        });

        const drawEnd = this._drawInteraction.on("drawend", (e) => {
            this._setState("active:saving");

            const layerUrl = this._editLayerURL;

            const geometry = e.feature.getGeometry();
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
            saveCreatedFeature(this._httpService, layerUrl, geoJSONGeometry, projection)
                .then((featureId) => {
                    this._destroy();
                    this.#waiter?.resolve(featureId);
                })
                .catch((err: Error) => {
                    console.log(err);
                    this._destroy();
                    this.#waiter?.reject(err);
                });
        });

        // update event handler when container changes
        const changedContainer = this._map.on("changed:container", () => {
            this._mapContainer?.removeEventListener("keydown", this._escapeHandler);

            this._mapContainer = this._olMap.getTargetElement() ?? undefined;
            if (this._mapContainer) {
                this._mapContainer.addEventListener("keydown", this._escapeHandler, false);
            }
        });

        this._interactionListener.push(drawStart, drawEnd);
        this._mapListener.push(changedContainer);
    }

    reset() {
        this._drawInteraction.abortDrawing();
        this._tooltip.element.textContent = this._intl.formatMessage({ id: "tooltip.begin" });
        this._setState("active:initialized");
    }

    stop() {
        this._destroy();
        this.#waiter?.resolve(undefined);
    }

    private _destroy() {
        this._olMap.removeLayer(this._drawLayer);
        this._olMap.removeInteraction(this._drawInteraction);
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
        element.textContent = this._intl.formatMessage({ id: "tooltip.begin" });

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
