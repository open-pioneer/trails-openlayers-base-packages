// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { batch, ReadonlyReactive } from "@conterra/reactivity-core";
import { createLogger } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import { PackageIntl } from "@open-pioneer/runtime";
import { MapBrowserEvent } from "ol";
import { getCenter } from "ol/extent";
import { DragZoom, defaults as defaultInteractions } from "ol/interaction";
import TileLayer from "ol/layer/Tile";
import OlMap, { MapOptions } from "ol/Map";
import { Projection, get as getProjection } from "ol/proj";
import OSM from "ol/source/OSM";
import View, { ViewOptions } from "ol/View";
import { sourceId } from "open-pioneer:source-info";
import { Layer } from "..";
import { DECLARED_AS_BASE_LAYER } from "../layers/shared/internals";
import { INTERNAL_CONSTRUCTOR_TAG } from "../utils/InternalConstructorTag";
import { patchOpenLayersClassesForTesting } from "../utils/ol-test-support";
import { registerProjections } from "../utils/projections";
import { MapConfig } from "./MapConfig";
import { MapModel } from "./MapModel";

/**
 * Register custom projection to the global proj4js definitions. User can select `EPSG:25832`
 * and `EPSG:25833` from the predefined projections without calling `registerProjections`.
 */
registerProjections({
    "EPSG:25832":
        "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
    "EPSG:25833":
        "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
});
const LOG = createLogger(sourceId);

export async function createMapModel(
    mapId: string,
    mapConfig: MapConfig,
    currentIntl: ReadonlyReactive<PackageIntl>,
    httpService: HttpService
): Promise<MapModel> {
    return await new MapModelFactory(mapId, mapConfig, currentIntl, httpService).createMapModel();
}

class MapModelFactory {
    #mapId: string;
    #mapConfig: MapConfig;
    #currentIntl: ReadonlyReactive<PackageIntl>;
    #httpService: HttpService;

    constructor(
        mapId: string,
        mapConfig: MapConfig,
        currentIntl: ReadonlyReactive<PackageIntl>,
        httpService: HttpService
    ) {
        this.#mapId = mapId;
        this.#mapConfig = mapConfig;
        this.#currentIntl = currentIntl;
        this.#httpService = httpService;
    }

    async createMapModel() {
        const mapId = this.#mapId;
        const mapConfig = this.#mapConfig;
        const { view: viewOption, ...rawOlOptions } = mapConfig.advanced ?? {};
        const showDefaultAttributions =
            mapConfig.showAttributions ?? (rawOlOptions.controls ? false : true);

        const mapOptions: MapOptions = {
            ...rawOlOptions
        };
        if (!mapOptions.controls) {
            mapOptions.controls = [];
        }
        if (!mapOptions.interactions) {
            const shiftCtrlKeysOnly = (
                mapBrowserEvent: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>
            ) => {
                const originalEvent = mapBrowserEvent.originalEvent;
                return (originalEvent.metaKey || originalEvent.ctrlKey) && originalEvent.shiftKey;
            };

            // setting altShiftDragRotate to false disables or excludes DragRotate interaction
            mapOptions.interactions = defaultInteractions({
                dragPan: true,
                altShiftDragRotate: false,
                pinchRotate: false,
                mouseWheelZoom: true
            }).extend([new DragZoom({ out: true, condition: shiftCtrlKeysOnly })]);
        }

        const view = (await viewOption) ?? {};
        this.#initializeViewOptions(view);
        mapOptions.view = view instanceof View ? view : new View(view);

        if (!mapOptions.layers && !mapConfig.layers) {
            mapOptions.layers = [
                new TileLayer({
                    source: new OSM()
                })
            ];
        }

        const initialView = mapConfig.initialView;
        const initialExtent = initialView?.kind === "extent" ? initialView.extent : undefined;

        LOG.debug(`Constructing OpenLayers map with options`, mapOptions);

        if (import.meta.env.VITEST) {
            patchOpenLayersClassesForTesting();
        }

        const olMap = new OlMap(mapOptions);
        const mapModel = new MapModel(
            {
                id: mapId,
                olMap,
                initialExtent,
                showDefaultAttributions,
                currentIntl: this.#currentIntl,
                httpService: this.#httpService
            },
            INTERNAL_CONSTRUCTOR_TAG
        );

        return batch(() => {
            try {
                this.#assertUniqueLayerPlacement(mapConfig);
                if (mapConfig.layers) {
                    for (const layerConfig of mapConfig.layers) {
                        if (
                            mapConfig.baseLayers &&
                            layerConfig[DECLARED_AS_BASE_LAYER]() !== undefined
                        ) {
                            LOG.warn(
                                `Prefer to configure base layer '${layerConfig.title ?? layerConfig.id}' in the 'MapConfig.baseLayers' property instead of using the 'LayerConfig.isBaseLayer' property.`
                            );
                        }

                        mapModel.layers.addLayer(layerConfig);
                    }
                }
                if (mapConfig.baseLayers) {
                    for (const layerConfig of mapConfig.baseLayers) {
                        if (layerConfig[DECLARED_AS_BASE_LAYER]() !== undefined) {
                            if (layerConfig[DECLARED_AS_BASE_LAYER]() === true) {
                                LOG.warn(
                                    `Base layer ${layerConfig.title ?? layerConfig.id} is already configured in the 'MapConfig.baseLayers' property. The 'LayerConfig.isBaseLayer' property can be omitted.`
                                );
                            } else if (layerConfig[DECLARED_AS_BASE_LAYER]() === false) {
                                LOG.warn(
                                    `Base layer ${layerConfig.title ?? layerConfig.id} is configured in the 'MapConfig.baseLayers' property but 'LayerConfig.isBaseLayer' property is explicitly set to false. This layer will be treated as a base layer. Prefer using only the 'MapConfig.baseLayers' property for base layers.`
                                );
                            }
                        }

                        mapModel.layers.addLayer(layerConfig, { at: "base" });
                    }
                }
                if (mapConfig.topmostLayers) {
                    for (const layerConfig of mapConfig.topmostLayers) {
                        if (layerConfig[DECLARED_AS_BASE_LAYER]() !== undefined) {
                            LOG.warn(
                                `Topmost layer ${layerConfig.title ?? layerConfig.id} is configured in the 'MapConfig.topmostLayers'. The 'LayerConfig.isBaseLayer' property can be omitted.`
                            );
                        }

                        mapModel.layers.addLayer(layerConfig, { at: "topmost" });
                    }
                }
                return mapModel;
            } catch (e) {
                mapModel.destroy();
                throw e;
            }
        });
    }

    #initializeViewOptions(view: View | ViewOptions) {
        const mapId = this.#mapId;
        const mapConfig = this.#mapConfig;
        if (view instanceof View) {
            const warn = (prop: string) => {
                LOG.warn(
                    `The advanced configuration for map id '${mapId}' has provided a fully constructed view instance: ${prop} cannot be applied.\n` +
                        `Use ViewOptions instead of a View instance.`
                );
            };

            if (mapConfig.projection != null) {
                warn("projection");
            }
            if (mapConfig.initialView != null) {
                warn("initialView");
            }
            return;
        }

        const projection = (view.projection = this.#initializeProjection(mapConfig.projection));
        const initialView = mapConfig.initialView;
        if (initialView) {
            switch (initialView.kind) {
                case "position":
                    view.zoom = initialView.zoom;
                    view.center = [initialView.center.x, initialView.center.y];
                    break;
                case "extent": {
                    /*
                        OpenLayers does not support configuration of the initial map extent.
                        The only relevant options here are center, zoom (and resolution).
                        We must set those values because otherwise OpenLayers will not initialize layer sources.

                        The actual initial extent is applied once tha map has loaded and its size is known.
                    */
                    const extent = initialView.extent;
                    view.zoom = 0;
                    view.center = [
                        extent.xMin + (extent.xMax - extent.xMin) / 2,
                        extent.yMin + (extent.yMax - extent.yMin) / 2
                    ];
                    break;
                }
            }
        } else {
            this.#setViewDefaults(view, projection);
        }
    }

    #setViewDefaults(view: ViewOptions, projection: Projection) {
        if (view.center == null) {
            const extent = projection.getExtent(); // can be null
            if (!extent) {
                LOG.warn(
                    `Cannot set default center coordinate because the current projection has no associated extent.\n` +
                        `Try to configure 'initialView' explicity.`
                );
            } else {
                view.center = getCenter(extent);
            }
        }

        if (view.zoom == null || view.resolution == null) {
            view.zoom = 0;
        }
    }

    #initializeProjection(projectionOption: MapConfig["projection"]) {
        if (projectionOption == null) {
            // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
            return getProjection("EPSG:3857")!; // default OpenLayers projection
        }

        const projection = getProjection(projectionOption);
        if (!projection) {
            throw new Error(`Failed to retrieve projection for code '${projectionOption}'.`);
        }
        return projection;
    }

    #assertUniqueLayerPlacement(mapConfig: MapConfig) {
        const groups = new Map<"baseLayers" | "layers" | "topmostLayers", Layer[] | undefined>([
            ["baseLayers", mapConfig.baseLayers],
            ["layers", mapConfig.layers],
            ["topmostLayers", mapConfig.topmostLayers]
        ]);

        const groupByLayer = new WeakMap<Layer, string>();

        for (const [groupName, layers] of groups) {
            if (!layers) {
                continue;
            }

            for (const layer of layers) {
                const previousGroup = groupByLayer.get(layer);
                if (previousGroup != null) {
                    throw new Error(
                        `Layer '${layer.title ?? layer.id}' is configured in both '${previousGroup}' and '${groupName}'. ` +
                            `A layer may only appear in one layer list.`
                    );
                }
                groupByLayer.set(layer, groupName);
            }
        }
    }
}
