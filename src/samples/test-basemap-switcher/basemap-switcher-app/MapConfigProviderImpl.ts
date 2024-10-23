// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider, SimpleLayer } from "@open-pioneer/map";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

import myImage from "./assets/map_717498.png"; // https://de.freepik.com/icon/karte_717498#fromView=search&page=1&position=3&uuid=affc743f-cf4c-4469-8919-f587e95295db

export const MAP_ID = "main";

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 404747, y: 5757920 },
                zoom: 14
            },
            layers: [
                new SimpleLayer({
                    title: "OSM",
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    }),
                    attributes: {
                        imageBasemapSwitcher: {
                            image: myImage,
                            label: "OSM"
                        }
                    }
                })
            ]
        };
    }
}
