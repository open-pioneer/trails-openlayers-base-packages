// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Reactive, ReadonlyReactive, effect, reactive } from "@conterra/reactivity-core";
import { ManualPromise, Resource, createManualPromise } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import { LayerFactory, MapModel, SimpleLayer } from "@open-pioneer/map";
import { PackageIntl } from "@open-pioneer/runtime";
import { Collection } from "ol";
import { EventsKey } from "ol/events";
import Feature from "ol/Feature";
import {
    default as GeoJSON,
    default as GeoJSONGeometry,
    default as GeoJSONGeometryCollection
} from "ol/format/GeoJSON";
import { Modify } from "ol/interaction";
import VectorLayer from "ol/layer/Vector";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import VectorSource from "ol/source/Vector";
import { FlatStyle } from "ol/style/flat";
import { EditingWorkflow, EditingWorkflowProps, EditingWorkflowState } from "./api";
import { saveUpdatedFeature } from "./SaveFeaturesHandler";
import { createStyles } from "./style-utils";
import { Tooltip, createTooltip } from "./Tooltip";

export class EditingUpdateWorkflowImpl implements EditingWorkflow {
    #waiter: ManualPromise<Record<string, string> | undefined> | undefined;

    #httpService: HttpService;
    #intl: ReadonlyReactive<PackageIntl>;
    #layerFactory: LayerFactory;

    #map: MapModel;
    #polygonStyle: FlatStyle;
    #vertexStyle: FlatStyle;
    #state: Reactive<EditingWorkflowState>;
    #editLayerURL: URL;
    #featureId: string | undefined;

    #initialFeature: Feature;
    #editFeature: Feature;
    #editingSource: VectorSource;
    #editingLayer: SimpleLayer;
    #modifyInteraction: Modify;
    #olMap: OlMap;
    #tooltip: Tooltip;
    #enterHandler: (e: KeyboardEvent) => void;
    #escapeHandler: (e: KeyboardEvent) => void;

    #error: Error | undefined;

    #interactionListener: Array<EventsKey>;
    #mapListener: Array<Resource>;

    constructor(options: { feature: Feature } & EditingWorkflowProps) {
        this.#httpService = options.httpService;
        this.#layerFactory = options.layerFactory;
        this.#intl = options.intl;

        this.#polygonStyle = options.polygonStyle;
        this.#vertexStyle = options.vertexStyle;

        this.#map = options.map;
        this.#olMap = options.map.olMap;
        this.#state = reactive("active:initialized");
        this.#editLayerURL = options.ogcApiFeatureLayerUrl;

        // Save copy of initial state for reset feature
        this.#initialFeature = options.feature.clone();
        this.#initialFeature.setId(options.feature.getId());

        // Work on copied feature to avoid the style to be applied on the original feature
        this.#editFeature = options.feature.clone();
        this.#editFeature.setId(options.feature.getId());

        this.#editFeature.setStyle(
            createStyles({
                polygon: this.#polygonStyle,
                vertex: this.#vertexStyle
            })
        );

        this.#editingSource = new VectorSource({
            features: new Collection([this.#editFeature])
        });

        const olLayer = new VectorLayer({
            source: this.#editingSource
        });
        this.#editingLayer = this.#layerFactory.create({
            type: SimpleLayer,
            title: "editing-layer",
            internal: true,
            olLayer: olLayer
        });

        this.#modifyInteraction = new Modify({
            source: this.#editingSource
        });

        this.#tooltip = createTooltip(
            this.#map,
            this.#intl.value.formatMessage({ id: "create.tooltip.deselect" })
        );

        this.#enterHandler = (e: KeyboardEvent) => {
            if (
                (e.code === "Enter" || e.code === "NumpadEnter") &&
                e.target === this.#olMap.getTargetElement()
            ) {
                const updatedFeature = this.#editingSource.getFeatures()[0];
                if (!updatedFeature) {
                    throw Error("no updated feature found");
                }
                this.#save(updatedFeature);
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

    getModifyInteraction() {
        return this.#modifyInteraction;
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

        this.#featureId = feature.getId()?.toString();
        if (!this.#featureId) {
            this.#destroy();
            this.#error = new Error("no feature id available");
            this.#waiter?.reject(this.#error);
            return;
        }

        const geometry = feature?.getGeometry();
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

        this.#olMap.removeInteraction(this.#modifyInteraction);
        this.#tooltip.destroy();

        saveUpdatedFeature(
            this.#httpService,
            layerUrl,
            this.#featureId,
            geoJSONGeometry,
            projection
        )
            .then((featureId) => {
                this.#destroy();
                this.#waiter?.resolve({ featureId });
            })
            .catch((err: Error) => {
                this.#destroy();
                this.#error = new Error("Failed to save feature", { cause: err });
                this.#waiter?.reject(this.#error);
            });
    }

    #start() {
        this.#map.layers.addLayer(this.#editingLayer, { at: "topmost" });
        this.#olMap.addInteraction(this.#modifyInteraction);

        const feature = this.#editingSource.getFeatures()[0];
        if (feature && !feature.getId()?.toString()) {
            this.#destroy();
            this.#error = new Error("no feature id available");
            this.#waiter?.reject(this.#error);
            return;
        }

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

        const click = this.#map.olMap.on("click", (e) => {
            const coordinate = e.coordinate;
            const altKeyPressed = e.originalEvent.altKey;
            const features = this.#editingSource.getFeaturesAtCoordinate(coordinate);

            if (altKeyPressed) {
                return;
            }

            if (features.length === 0) {
                this.triggerSave();
            }
        });

        const modify = this.#modifyInteraction.on("modifystart", () => {
            this.#setState("active:drawing");
        });

        this.#interactionListener.push(click, modify);
        this.#mapListener.push(containerEvents);
    }

    reset() {
        // Clone geometry to pass geometry, not reference
        const geometry = this.#initialFeature.getGeometry()?.clone();

        const resetFeature = this.#editingSource.getFeatures()[0];
        if (!resetFeature) {
            throw Error("no updated feature found");
        }
        resetFeature.setGeometry(geometry);

        this.#setState("active:initialized");
    }

    stop() {
        this.#destroy();
        this.#waiter?.resolve(undefined);
    }

    #destroy() {
        this.#editingSource.clear();
        this.#map.layers.removeLayer(this.#editingLayer);
        this.#editingLayer.destroy();
        this.#olMap.removeInteraction(this.#modifyInteraction);
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
        const feature = this.#editingSource.getFeatures()[0];
        if (!feature) {
            throw Error("no updated feature found");
        }
        this.#save(feature);
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
