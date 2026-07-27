// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    MapConfig,
    MapConfigProvider,
    MapConfigProviderOptions,
    SimpleLayer
} from "@open-pioneer/map";
import { View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

export const MAP_ID = "main";

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig({ layerFactory }: MapConfigProviderOptions): Promise<MapConfig> {
        return {
            advanced: {
                view: new View({
                    center: [404747, 5757920],
                    zoom: 13,
                    constrainResolution: true,
                    projection: "EPSG:25832"
                })
            },
            layers: [
                layerFactory.create({
                    type: SimpleLayer,
                    title: "OpenStreetMaps",
                    visible: true,
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                })
            ]
        };
    }
}
