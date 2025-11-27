// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    MapConfig,
    MapConfigProvider,
    MapConfigProviderOptions,
    WMTSLayer
} from "@open-pioneer/map";

export const MAP_ID = "main";

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig({ layerFactory }: MapConfigProviderOptions): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 404747, y: 5757920 },
                zoom: 14
            },
            projection: "EPSG:25832",
            layers: [
                layerFactory.create({
                    type: WMTSLayer,
                    isBaseLayer: true,
                    title: "Topplus farbig",
                    url: "https://www.wmts.nrw.de/topplus_open/1.0.0/WMTSCapabilities.xml",
                    name: "topplus_col",
                    matrixSet: "EPSG_25832_14",
                    visible: true,
                    sourceOptions: {
                        attributions: `Kartendarstellung und Präsentationsgraphiken: &copy; Bundesamt für Kartographie und Geodäsie ${new Date().getFullYear()}, <a title="Datenquellen öffnen" aria-label="Datenquellen öffnen" href="https://sg.geodatenzentrum.de/web_public/gdz/datenquellen/Datenquellen_TopPlusOpen.html " target="_blank">Datenquellen</a>`
                    }
                })
            ]
        };
    }
}
