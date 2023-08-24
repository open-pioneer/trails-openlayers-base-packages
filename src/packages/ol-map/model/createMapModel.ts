// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import OlMap, { MapOptions } from "ol/Map";
import View, { ViewOptions } from "ol/View";
import Attribution from "ol/control/Attribution";
import { getCenter } from "ol/extent";
import TileLayer from "ol/layer/Tile";
import { Projection, get as getProjection } from "ol/proj";
import OSM from "ol/source/OSM";
import { MapModelImpl } from "./MapModelImpl";
import { MapConfig } from "../api";

const LOG = createLogger("ol-map:createMapModel");

export async function createMapModel(mapId: string, mapConfig: MapConfig): Promise<MapModelImpl> {
    return await new MapModelFactory(mapId, mapConfig).createMapModel();
}

class MapModelFactory {
    private mapId: string;
    private mapConfig: MapConfig;

    constructor(mapId: string, mapConfig: MapConfig) {
        this.mapId = mapId;
        this.mapConfig = mapConfig;
    }

    async createMapModel() {
        const mapId = this.mapId;
        const mapConfig = this.mapConfig;
        const { view: viewOption, ...rawOlOptions } = mapConfig.advanced ?? {};
        const mapOptions: MapOptions = {
            ...rawOlOptions
        };

        if (!mapOptions.controls) {
            mapOptions.controls = [new Attribution({ collapsible: false })];
        }

        const view = (await viewOption) ?? {};
        this.initializeViewOptions(view);
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

        LOG.debug(`Constructing open layers map with options`, mapOptions);
        const olMap = new OlMap(mapOptions);
        const mapModel = new MapModelImpl({
            id: mapId,
            olMap,
            initialExtent
        });

        try {
            if (mapConfig.layers) {
                for (const layerConfig of mapConfig.layers) {
                    mapModel.layers.createLayer(layerConfig);
                }
            }
            return mapModel;
        } catch (e) {
            mapModel.destroy();
            throw e;
        }
    }

    private initializeViewOptions(view: View | ViewOptions) {
        const mapId = this.mapId;
        const mapConfig = this.mapConfig;
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

        const projection = (view.projection = this.initializeProjection(mapConfig.projection));
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
                            We must set those values because otherwise OL will not initialize layer sources.

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
            this.setViewDefaults(view, projection);
        }
    }

    private setViewDefaults(view: ViewOptions, projection: Projection) {
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

    private initializeProjection(projectionOption: MapConfig["projection"]) {
        if (projectionOption == null) {
            return getProjection("EPSG:3857")!; // default OpenLayers projection
        }

        const projection = getProjection(projectionOption);
        if (!projection) {
            throw new Error(`Failed to retrieve projection for code '${projectionOption}'.`);
        }
        return projection;
    }
}
