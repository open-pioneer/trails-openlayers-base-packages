// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    SimpleLayer, WMSLayer, type Layer, type MapConfigProvider, type MapConfig
} from "@open-pioneer/map";

import { Tile as TileLayer } from "ol/layer";
import { OSM } from "ol/source";

export class MainMapProvider implements MapConfigProvider {
    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: {
                    x: 847541,
                    y: 6793584
                },
                zoom: 14
            },
            projection: "EPSG:3857",
            layers: [
                this.createOSMLayer(),
                this.createStrassenLayer()
            ]
        };
    }

    get mapId(): string {
        return MAP_ID;
    }

    private createOSMLayer(): Layer {
        return new SimpleLayer({
            title: "OpenStreetMap",
            olLayer: new TileLayer({
                source: new OSM(),
                properties: {
                    title: "OSM"
                }
            }),
            isBaseLayer: true
        });
    }

    private createStrassenLayer(): Layer {
        return new WMSLayer({
            title: "Straßennetz Landesbetrieb Straßenbau NRW",
            url: "https://www.wms.nrw.de/wms/strassen_nrw_wms",
            visible: true,
            sublayers: [
                {
                    name: "1",
                    title: "Verwaltungen",
                    attributes: {
                        "legend": {
                            imageUrl: "https://www.wms.nrw.de/legends/wms/strassen_nrw_wms/1.png"
                        }
                    }
                },
                {
                    name: "4",
                    title: "Abschnitte und Äste"
                },
                {
                    name: "6",
                    title: "Unfälle"
                }
            ]
        });
    }
}

export const MAP_ID = "main";
