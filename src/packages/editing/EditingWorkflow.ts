// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ManualPromise, createAbortError, createManualPromise } from "@open-pioneer/core";
import { MapModel, TOPMOST_LAYER_Z } from "@open-pioneer/map";
import { Draw } from "ol/interaction";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { References } from "./EditingImpl";
import { MapRegistry } from "@open-pioneer/map";
import { HttpService } from "@open-pioneer/http";
import { PackageIntl, ServiceOptions } from "@open-pioneer/runtime";
import { StyleLike } from "ol/style/Style";
import { GeoJSON } from "ol/format";
import { saveCreatedFeature } from "./SaveFeaturesHandler";
import OlMap from "ol/Map";
import Overlay from "ol/Overlay";
import { Resource } from "@open-pioneer/core";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";
import { EditingWorkflowState, EditingWorkflowType } from "./api";

// const LOG = createLogger("editing:EditingWorkflow");

// TODO: Push EventListener to array to destroy/unByKey
// TODO: Set states / watch state

// Represents a tooltip rendered on the OpenLayers map
interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
}

export class EditingWorkflow implements EditingWorkflowType {
    #featureId: string | undefined;
    #waiter: ManualPromise<string> | undefined;

    private readonly _mapRegistry: MapRegistry;
    private _httpService: HttpService;
    private _intl: PackageIntl;

    private _map: MapModel;
    private _polygonDrawStyle: StyleLike;
    private _state: EditingWorkflowState;

    private _drawSource: VectorSource;
    private _drawLayer: VectorLayer<VectorSource>;
    private _drawInteraction: Draw;
    private _olMap: OlMap;
    private _tooltip: Tooltip;
    private _escapeHandler: (e: KeyboardEvent) => void;

    private _interactionListener: Array<EventsKey>;
    private _mapListener: Array<Resource>;

    constructor(map: MapModel, options: ServiceOptions<References>) {
        this._mapRegistry = options.references.mapRegistry;
        this._httpService = options.references.httpService;
        this._intl = options.intl;

        this._polygonDrawStyle = options.properties.polygonDrawStyle as StyleLike;

        this._map = map;
        this._olMap = map.olMap;
        this._state = "active:initialized";

        this._drawSource = new VectorSource();
        this._drawLayer = new VectorLayer({
            source: this._drawSource,
            zIndex: TOPMOST_LAYER_Z
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

    getState() {
        return this._state;
    }

    private _start() {
        this._olMap.addLayer(this._drawLayer);
        this._olMap.addInteraction(this._drawInteraction);

        // Add EventListener on focused map to abort actual interaction via `Escape`
        let mapContainer: HTMLElement | undefined = this._olMap.getTargetElement() ?? undefined;
        if (mapContainer) {
            mapContainer.addEventListener("keydown", this._escapeHandler, false);
        }

        this._tooltip.element.classList.remove("hidden");

        const drawStart = this._drawInteraction.on("drawstart", () => {
            this._tooltip.element.textContent = this._intl.formatMessage({
                id: "tooltip.continue"
            });
        });

        const drawEnd = this._drawInteraction.on("drawend", (e) => {
            // todo use mapId to get correct layer --> get layer url
            const layerUrl =
                "https://ogc-api-test.nrw.de/inspire-us-krankenhaus/v1/collections/governmentalservice/items";

            const geometry = e.feature.getGeometry();
            if (!geometry) {
                console.log("no geometry available");
                // todo stop editing?
                return;
            }
            const geoJson = new GeoJSON({
                featureProjection: "EPSG:25832",
                dataProjection: "EPSG:25832" //map?.olMap.getView().getProjection() // todo is this correct and needed?
            });
            const geoJSONGeometry = geoJson.writeGeometryObject(geometry, {
                rightHanded: true,
                decimals: 10
            });
            // todo set default properties when saving feature?
            saveCreatedFeature(this._httpService, layerUrl, geoJSONGeometry)
                .then((featureId) => {
                    this.#waiter?.resolve(featureId);
                    this._destroy(); // todo destroy already on drawend to avoid user from drawing during request?
                })
                .catch((err) => {
                    this._destroy(err);
                });
        });

        // update event handler when container changes
        const changedContainer = this._map.on("changed:container", () => {
            mapContainer?.removeEventListener("keydown", this._escapeHandler);

            mapContainer = this._olMap.getTargetElement() ?? undefined;
            if (mapContainer) {
                mapContainer.addEventListener("keydown", this._escapeHandler, false);
            }
        });

        this._interactionListener.push(drawStart, drawEnd);
        this._mapListener.push(changedContainer);

        // // drawstart Event Listener
        // this._state = "active:drawing";

        // // drawend Event Listener
        // this._state = "active:saving";
    }

    reset() {
        this._drawInteraction.abortDrawing();
        this._tooltip.element.textContent = this._intl.formatMessage({ id: "tooltip.begin" });
    }

    stop() {
        this._destroy("workflow stopped");
    }

    // TODO: Cancel request
    // TODO: better type for error?
    private _destroy(error?: unknown) {
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
        this._olMap.getTargetElement().removeEventListener("keydown", this._escapeHandler);

        // TODO: resolve or reject if destroy is called by stop?
        const errorToReject = error ? error : createAbortError();
        this.#waiter?.reject(errorToReject);
    }

    whenComplete(): Promise<string> {
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
