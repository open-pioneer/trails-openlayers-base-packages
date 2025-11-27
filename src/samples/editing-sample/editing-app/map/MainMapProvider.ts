// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    SimpleLayer,
    type Layer,
    type LayerFactory,
    type MapConfig,
    type MapConfigProvider,
    type MapConfigProviderOptions
} from "@open-pioneer/map";

import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { OSM, Vector as VectorSource } from "ol/source";

import { InMemoryStore } from "../store/InMemoryStore";
import { LAYER_CONFIG } from "./layerConfig";

export class MainMapProvider implements MapConfigProvider {
    async getMapConfig({ layerFactory }: MapConfigProviderOptions): Promise<MapConfig> {
        return {
            ...MainMapProvider.MAP_SETTINGS,
            layers: [this.createOSMLayer(layerFactory), ...this.createIDBLayers(layerFactory)]
        };
    }

    get mapId(): string {
        return MAP_ID;
    }

    private createOSMLayer(layerFactory: LayerFactory): Layer {
        return layerFactory.create({
            title: "OpenStreetMap",
            type: SimpleLayer,
            olLayer: new TileLayer({
                source: new OSM(),
                properties: {
                    title: "OSM"
                }
            }),
            isBaseLayer: true
        });
    }

    private createIDBLayers(layerFactory: LayerFactory): Layer[] {
        return [...LAYER_CONFIG].reverse().map(({ id, title, style }) => {
            const store = InMemoryStore.getOrCreate(id);

            return layerFactory.create({
                id,
                title,
                type: SimpleLayer,
                visible: true,
                olLayer: new VectorLayer({
                    source: new VectorSource({
                        features: store.getCollection()
                    }),
                    style,
                    updateWhileAnimating: true,
                    updateWhileInteracting: true,
                    properties: { id, title }
                })
            });
        });
    }

    private static readonly MAP_SETTINGS: Omit<MapConfig, "layers"> = {
        initialView: {
            kind: "position",
            center: {
                x: 847541.0,
                y: 6793584.0
            },
            zoom: 14
        },
        projection: "EPSG:3857"
    };
}

export const MAP_ID = "main";
