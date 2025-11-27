// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Reactive, effect, reactive } from "@conterra/reactivity-core";
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

    private _httpService: HttpService;
    private _intl: PackageIntl;
    private _layerFactory: LayerFactory;

    private _map: MapModel;
    private _polygonStyle: FlatStyle;
    private _vertexStyle: FlatStyle;
    private _state: Reactive<EditingWorkflowState>;
    private _editLayerURL: URL;
    private _featureId: string | undefined;

    private _initialFeature: Feature;
    private _editFeature: Feature;
    private _editingSource: VectorSource;
    private _editingLayer: SimpleLayer;
    private _modifyInteraction: Modify;
    private _olMap: OlMap;
    private _tooltip: Tooltip;
    private _enterHandler: (e: KeyboardEvent) => void;
    private _escapeHandler: (e: KeyboardEvent) => void;

    private _error: Error | undefined;

    private _interactionListener: Array<EventsKey>;
    private _mapListener: Array<Resource>;

    constructor(options: { feature: Feature } & EditingWorkflowProps) {
        this._httpService = options.httpService;
        this._layerFactory = options.layerFactory;
        this._intl = options.intl;

        this._polygonStyle = options.polygonStyle;
        this._vertexStyle = options.vertexStyle;

        this._map = options.map;
        this._olMap = options.map.olMap;
        this._state = reactive("active:initialized");
        this._editLayerURL = options.ogcApiFeatureLayerUrl;

        // Save copy of initial state for reset feature
        this._initialFeature = options.feature.clone();
        this._initialFeature.setId(options.feature.getId());

        // Work on copied feature to avoid the style to be applied on the original feature
        this._editFeature = options.feature.clone();
        this._editFeature.setId(options.feature.getId());

        this._editFeature.setStyle(
            createStyles({
                polygon: this._polygonStyle,
                vertex: this._vertexStyle
            })
        );

        this._editingSource = new VectorSource({
            features: new Collection([this._editFeature])
        });

        const olLayer = new VectorLayer({
            source: this._editingSource
        });
        this._editingLayer = this._layerFactory.create({
            type: SimpleLayer,
            title: "editing-layer",
            internal: true,
            olLayer: olLayer
        });

        this._modifyInteraction = new Modify({
            source: this._editingSource
        });

        this._tooltip = createTooltip(
            this._olMap,
            this._intl.formatMessage({ id: "create.tooltip.deselect" })
        );

        this._enterHandler = (e: KeyboardEvent) => {
            if (
                (e.code === "Enter" || e.code === "NumpadEnter") &&
                e.target === this._olMap.getTargetElement()
            ) {
                const updatedFeature = this._editingSource.getFeatures()[0];
                if (!updatedFeature) {
                    throw Error("no updated feature found");
                }
                this._save(updatedFeature);
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

    getModifyInteraction() {
        return this._modifyInteraction;
    }

    getState() {
        return this._state.value;
    }

    private _setState(state: EditingWorkflowState) {
        this._state.value = state;
    }

    private _save(feature: Feature) {
        this._setState("active:saving");

        const layerUrl = this._editLayerURL;

        this._featureId = feature.getId()?.toString();
        if (!this._featureId) {
            this._destroy();
            this._error = new Error("no feature id available");
            this.#waiter?.reject(this._error);
            return;
        }

        const geometry = feature?.getGeometry();
        if (!geometry) {
            this._destroy();
            this._error = new Error("no geometry available");
            this.#waiter?.reject(this._error);
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

        this._olMap.removeInteraction(this._modifyInteraction);
        this._tooltip.destroy();

        saveUpdatedFeature(
            this._httpService,
            layerUrl,
            this._featureId,
            geoJSONGeometry,
            projection
        )
            .then((featureId) => {
                this._destroy();
                this.#waiter?.resolve({ featureId });
            })
            .catch((err: Error) => {
                this._destroy();
                this._error = new Error("Failed to save feature", { cause: err });
                this.#waiter?.reject(this._error);
            });
    }

    private _start() {
        this._map.layers.addLayer(this._editingLayer, { at: "topmost" });
        this._olMap.addInteraction(this._modifyInteraction);

        const feature = this._editingSource.getFeatures()[0];
        if (feature && !feature.getId()?.toString()) {
            this._destroy();
            this._error = new Error("no feature id available");
            this.#waiter?.reject(this._error);
            return;
        }

        // Add EventListener on focused map to abort actual interaction via `Escape`
        const containerEvents = effect(() => {
            const container = this._map.container;
            if (!container) {
                return;
            }

            container.addEventListener("keydown", this._enterHandler, false);
            container.addEventListener("keydown", this._escapeHandler, false);
            return () => {
                container.removeEventListener("keydown", this._enterHandler);
                container.removeEventListener("keydown", this._escapeHandler);
            };
        });

        this._tooltip.setVisible(true);

        const click = this._map.olMap.on("click", (e) => {
            const coordinate = e.coordinate;
            const altKeyPressed = e.originalEvent.altKey;
            const features = this._editingSource.getFeaturesAtCoordinate(coordinate);

            if (altKeyPressed) {
                return;
            }

            if (features.length === 0) {
                this.triggerSave();
            }
        });

        const modify = this._modifyInteraction.on("modifystart", () => {
            this._setState("active:drawing");
        });

        this._interactionListener.push(click, modify);
        this._mapListener.push(containerEvents);
    }

    reset() {
        // Clone geometry to pass geometry, not reference
        const geometry = this._initialFeature.getGeometry()?.clone();

        const resetFeature = this._editingSource.getFeatures()[0];
        if (!resetFeature) {
            throw Error("no updated feature found");
        }
        resetFeature.setGeometry(geometry);

        this._setState("active:initialized");
    }

    stop() {
        this._destroy();
        this.#waiter?.resolve(undefined);
    }

    private _destroy() {
        this._editingSource.clear();
        this._map.layers.removeLayer(this._editingLayer);
        this._editingLayer.destroy();
        this._olMap.removeInteraction(this._modifyInteraction);
        this._tooltip.destroy();

        // Remove event listener on interaction and on map
        this._interactionListener.forEach((listener) => {
            unByKey(listener);
        });
        this._mapListener.forEach((listener) => {
            listener.destroy();
        });

        this._setState("destroyed");
    }

    triggerSave() {
        const feature = this._editingSource.getFeatures()[0];
        if (!feature) {
            throw Error("no updated feature found");
        }
        this._save(feature);
    }

    whenComplete(): Promise<Record<string, string> | undefined> {
        if (this._state.value === "destroyed") {
            if (this._error) {
                return Promise.reject(this._error);
            } else {
                if (this._featureId) {
                    return Promise.resolve({ featureId: this._featureId });
                } else {
                    return Promise.resolve(undefined);
                }
            }
        }

        const manualPromise = (this.#waiter ??= createManualPromise());
        return manualPromise.promise;
    }
}
