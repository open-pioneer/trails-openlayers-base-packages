// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { effect, Reactive, reactive, ReadonlyReactive } from "@conterra/reactivity-core";
import { createLogger, createManualPromise, ManualPromise, Resource } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import { LayerFactory, MapModel, SimpleLayer } from "@open-pioneer/map";
import { PackageIntl } from "@open-pioneer/runtime";
import Feature from "ol/Feature";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";
import {
    default as GeoJSON,
    default as GeoJSONGeometry,
    default as GeoJSONGeometryCollection
} from "ol/format/GeoJSON";
import { Draw } from "ol/interaction";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { FlatStyle } from "ol/style/flat";
import { sourceId } from "open-pioneer:source-info";
import { saveCreatedFeature } from "./SaveFeaturesHandler";
import { createTooltip, Tooltip } from "./Tooltip";
import { EditingWorkflow, EditingWorkflowProps, EditingWorkflowState } from "./api";
import { createStyles } from "./style-utils";

const LOG = createLogger(sourceId);

export class EditingCreateWorkflowImpl implements EditingWorkflow {
    #waiter: ManualPromise<Record<string, string> | undefined> | undefined;

    #httpService: HttpService;
    #layerFactory: LayerFactory;
    #intl: ReadonlyReactive<PackageIntl>;

    #map: MapModel;
    #polygonStyle: FlatStyle;
    #vertexStyle: FlatStyle;
    #state: Reactive<EditingWorkflowState>;
    #editLayerURL: URL;
    #featureId: string | undefined;

    #editingSource: VectorSource;
    #editingLayer: SimpleLayer;
    #drawInteraction: Draw;
    #olMap: OlMap;
    #tooltip: Tooltip;
    #enterHandler: (e: KeyboardEvent) => void;
    #escapeHandler: (e: KeyboardEvent) => void;

    #error: Error | undefined;

    #interactionListener: Array<EventsKey>;
    #mapListener: Array<Resource>;

    constructor(options: EditingWorkflowProps) {
        this.#httpService = options.httpService;
        this.#layerFactory = options.layerFactory;
        this.#intl = options.intl;

        this.#polygonStyle = options.polygonStyle;
        this.#vertexStyle = options.vertexStyle;

        this.#map = options.map;
        this.#olMap = options.map.olMap;
        this.#state = reactive("active:initialized");
        this.#editLayerURL = options.ogcApiFeatureLayerUrl;

        this.#editingSource = new VectorSource();
        const olLayer = new VectorLayer({
            source: this.#editingSource
        });
        this.#editingLayer = this.#layerFactory.create({
            type: SimpleLayer,
            title: "editing-layer",
            internal: true,
            olLayer: olLayer
        });

        this.#drawInteraction = new Draw({
            source: this.#editingSource,
            type: "Polygon",
            style: createStyles({
                polygon: this.#polygonStyle,
                vertex: this.#vertexStyle
            })
        });

        this.#tooltip = createTooltip(
            this.#map,
            this.#intl.value.formatMessage({ id: "create.tooltip.begin" })
        );

        this.#enterHandler = (e: KeyboardEvent) => {
            if (
                (e.code === "Enter" || e.code === "NumpadEnter") &&
                e.target === this.#olMap.getTargetElement()
            ) {
                const features =
                    this.#drawInteraction.getOverlay().getSource()?.getFeatures() ?? [];

                /**
                 * Get the first linear ring of the polygon
                 * Coordinates include closing vertex, so a triangle has 4, while drawing the
                 * actual mouse position is an extra vertex, therefor we have to check
                 * "length > 4" instead of "length >= 4"
                 */
                if (features[0] && features[0].getGeometry().getCoordinates()[0].length > 4) {
                    this.triggerSave();
                }
            }
        };

        this.#escapeHandler = (e: KeyboardEvent) => {
            if (e.code === "Escape" && e.target === this.#olMap.getTargetElement()) {
                this.reset();
            }
        };

        this.#interactionListener = [];
        this.#mapListener = [];

        this.#start();
    }

    getDrawInteraction() {
        return this.#drawInteraction;
    }

    getState() {
        return this.#state.value;
    }

    #setState(state: EditingWorkflowState) {
        this.#state.value = state;
    }

    #save(feature: Feature) {
        this.#setState("active:saving");

        const layerUrl = this.#editLayerURL;

        const geometry = feature.getGeometry();
        if (!geometry) {
            this.#destroy();
            this.#error = new Error("no geometry available");
            this.#waiter?.reject(this.#error);
            return;
        }
        const projection = this.#olMap.getView().getProjection();
        const geoJson = new GeoJSON({
            dataProjection: projection
        });
        const geoJSONGeometry: GeoJSONGeometry | GeoJSONGeometryCollection =
            geoJson.writeGeometryObject(geometry, {
                rightHanded: true,
                decimals: 10
            });

        this.#olMap.removeInteraction(this.#drawInteraction);
        this.#tooltip.destroy();

        saveCreatedFeature(this.#httpService, layerUrl, geoJSONGeometry, projection)
            .then((featureId) => {
                this.#featureId = featureId;
                this.#destroy();
                this.#waiter?.resolve({ featureId: this.#featureId });
            })
            .catch((err: Error) => {
                LOG.error(err);
                this.#destroy();
                this.#error = new Error("Failed to save feature", { cause: err });
                this.#waiter?.reject(this.#error);
            });
    }

    #start() {
        this.#map.layers.addLayer(this.#editingLayer, { at: "topmost" });
        this.#olMap.addInteraction(this.#drawInteraction);

        // Add EventListener on focused map to abort actual interaction via `Escape`
        const containerEvents = effect(() => {
            const container = this.#map.container;
            if (!container) {
                return;
            }

            container.addEventListener("keydown", this.#enterHandler, false);
            container.addEventListener("keydown", this.#escapeHandler, false);
            return () => {
                container.removeEventListener("keydown", this.#enterHandler);
                container.removeEventListener("keydown", this.#escapeHandler);
            };
        });

        this.#tooltip.setVisible(true);

        const drawStart = this.#drawInteraction.on("drawstart", () => {
            this.#setState("active:drawing");
            this.#tooltip.setText(
                this.#intl.value.formatMessage({
                    id: "create.tooltip.continue"
                })
            );
        });

        const drawEnd = this.#drawInteraction.on("drawend", (e) => {
            const feature = e.feature;
            if (!feature) {
                this.#destroy();
                this.#error = new Error("no feature available");
                this.#waiter?.reject(this.#error);
                return;
            }
            this.#save(feature);
        });

        this.#interactionListener.push(drawStart, drawEnd);
        this.#mapListener.push(containerEvents);
    }

    reset() {
        this.#drawInteraction.abortDrawing();
        this.#tooltip.setText(
            this.#intl.value.formatMessage({
                id: "create.tooltip.begin"
            })
        );
        this.#setState("active:initialized");
    }

    stop() {
        this.#destroy();
        this.#waiter?.resolve(undefined);
    }

    #destroy() {
        this.#map.layers.removeLayer(this.#editingLayer);
        this.#editingLayer.destroy();
        this.#olMap.removeInteraction(this.#drawInteraction);
        this.#tooltip.destroy();

        // Remove event listener on interaction and on map
        this.#interactionListener.forEach((listener) => {
            unByKey(listener);
        });
        this.#mapListener.forEach((listener) => {
            listener.destroy();
        });

        this.#setState("destroyed");
    }

    triggerSave() {
        // Stop drawing - the `drawend` event is dispatched before inserting the feature.
        this.#drawInteraction.finishDrawing();
    }

    whenComplete(): Promise<Record<string, string> | undefined> {
        if (this.#state.value === "destroyed") {
            if (this.#error) {
                return Promise.reject(this.#error);
            } else {
                if (this.#featureId) {
                    return Promise.resolve({ featureId: this.#featureId });
                } else {
                    return Promise.resolve(undefined);
                }
            }
        }

        const manualPromise = (this.#waiter ??= createManualPromise());
        return manualPromise.promise;
    }
}
