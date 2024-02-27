// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter, ManualPromise, createLogger, createManualPromise } from "@open-pioneer/core";
import { MapModel, TOPMOST_LAYER_Z } from "@open-pioneer/map";
import { Draw } from "ol/interaction";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
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
import {
    EditingWorkflowEvents,
    EditingWorkflowState,
    EditingWorkflow,
    EditingWorkflowProps
} from "./api";
import Feature from "ol/Feature";

const LOG = createLogger("editing:EditingCreateWorkflowImpl");

// Represents a tooltip rendered on the OpenLayers map
interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
}

export class EditingCreateWorkflowImpl
    extends EventEmitter<EditingWorkflowEvents>
    implements EditingWorkflow
{
    #waiter: ManualPromise<string | undefined> | undefined;

    private _httpService: HttpService;
    private _intl: PackageIntl;

    private _map: MapModel;
    private _polygonDrawStyle: FlatStyleLike;
    private _state: EditingWorkflowState;
    private _editLayerURL: URL;

    private _editingSource: VectorSource;
    private _editingLayer: VectorLayer<VectorSource>;
    private _drawInteraction: Draw;
    private _olMap: OlMap;
    private _mapContainer: HTMLElement | undefined;
    private _tooltip: Tooltip;
    private _enterHandler: (e: KeyboardEvent) => void;
    private _escapeHandler: (e: KeyboardEvent) => void;

    private _interactionListener: Array<EventsKey>;
    private _mapListener: Array<Resource>;

    constructor(options: EditingWorkflowProps) {
        super();
        this._httpService = options.httpService;
        this._intl = options.intl;

        this._polygonDrawStyle = options.polygonDrawStyle;

        this._map = options.map;
        this._olMap = options.map.olMap;
        this._state = "active:initialized";
        this._editLayerURL = options.ogcApiFeatureLayerUrl;

        this._editingSource = new VectorSource();
        this._editingLayer = new VectorLayer({
            source: this._editingSource,
            zIndex: TOPMOST_LAYER_Z,
            properties: {
                name: "editing-layer"
            }
        });

        this._drawInteraction = new Draw({
            source: this._editingSource,
            type: "Polygon",
            style: this._polygonDrawStyle
        });

        this._tooltip = this._createTooltip(this._olMap);

        this._enterHandler = (e: KeyboardEvent) => {
            if (e.code === "Enter" && e.target === this._olMap.getTargetElement()) {
                const features = this._drawInteraction.getOverlay().getSource().getFeatures();

                /**
                 * Get the first linear ring of the polygon
                 * Coordinates include closing vertex, so a triangle has 4, while drawing the
                 * actual mouse position is an extra vertex, therefor we have to check
                 * "length > 4" instead of "length >= 4"
                 */
                if (features[0] && features[0].getGeometry().getCoordinates()[0].length > 4) {
                    this._drawInteraction.finishDrawing();
                }
            }
        };

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

    private _save(feature: Feature) {
        this._setState("active:saving");

        const layerUrl = this._editLayerURL;

        const geometry = feature.getGeometry();
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
                LOG.error(err);
                this._destroy();
                this.#waiter?.reject(new Error("Failed to save feature", { cause: err }));
            });
    }

    private _start() {
        this._olMap.addLayer(this._editingLayer);
        this._olMap.addInteraction(this._drawInteraction);

        // Add EventListener on focused map to abort actual interaction via `Escape`
        this._mapContainer = this._olMap.getTargetElement() ?? undefined;
        if (this._mapContainer) {
            this._mapContainer.addEventListener("keydown", this._enterHandler, false);
            this._mapContainer.addEventListener("keydown", this._escapeHandler, false);
        }

        this._tooltip.element.classList.remove("editing-tooltip-hidden");

        const drawStart = this._drawInteraction.on("drawstart", () => {
            this._setState("active:drawing");
            this._tooltip.element.textContent = this._intl.formatMessage({
                id: "create.tooltip.continue"
            });
        });

        const drawEnd = this._drawInteraction.on("drawend", (e) => {
            const feature = e.feature;
            if (!feature) {
                this._destroy();
                this.#waiter?.reject(new Error("no feature available"));
                return;
            }
            this._save(feature);
        });

        // update event handler when container changes
        const changedContainer = this._map.on("changed:container", () => {
            this._mapContainer?.removeEventListener("keydown", this._enterHandler);
            this._mapContainer?.removeEventListener("keydown", this._escapeHandler);

            this._mapContainer = this._olMap.getTargetElement() ?? undefined;
            if (this._mapContainer) {
                this._mapContainer.addEventListener("keydown", this._enterHandler, false);
                this._mapContainer.addEventListener("keydown", this._escapeHandler, false);
            }
        });

        this._interactionListener.push(drawStart, drawEnd);
        this._mapListener.push(changedContainer);
    }

    reset() {
        this._drawInteraction.abortDrawing();
        this._tooltip.element.textContent = this._intl.formatMessage({
            id: "create.tooltip.begin"
        });
        this._setState("active:initialized");
    }

    stop() {
        this._destroy();
        this.#waiter?.resolve(undefined);
    }

    private _destroy() {
        this._olMap.removeLayer(this._editingLayer);
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
        this._mapContainer?.removeEventListener("keydown", this._enterHandler);
        this._mapContainer?.removeEventListener("keydown", this._escapeHandler);

        this._setState("inactive");
    }

    save(): void {
        // Todo: Implement
    }

    whenComplete(): Promise<string | undefined> {
        // Todo:
        // if (this._state === "inactive") {
        //     return this.error ? Promise.reject(this.error) : Promise.resolve(this.featureId);
        // }
        const manualPromise = (this.#waiter ??= createManualPromise());
        return manualPromise.promise;
    }

    private _createTooltip(olMap: OlMap): Tooltip {
        const element = document.createElement("div");
        element.className = "editing-tooltip editing-tooltip-hidden";
        element.textContent = this._intl.formatMessage({ id: "create.tooltip.begin" });

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
