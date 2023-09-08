// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider } from "@open-pioneer/map";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Stamen from "ol/source/Stamen";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import { registerProjections } from "@open-pioneer/map";

export const MAP_ID = "main";

/**
 * Register custom projection to the global proj4js definitions.
 */
registerProjections({
    "EPSG:25832":
        "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
});

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    topLeftCorner = [-46133.17, 6301219.54];

    /**
     * The length of matrixIds needs to match the length of the resolutions array
     * @see https://openlayers.org/en/latest/apidoc/module-ol_tilegrid_WMTS-WMTSTileGrid.html
     */
    resolutions = [
        4891.96981025128, // AdV-Level 0  (1:17471320.7508974)
        2445.98490512564, // AdV-Level 1  (1:8735660.37544872)
        1222.99245256282, // AdV-Level 2  (1:4367830.18772436)
        611.49622628141, // AdV-Level 3   (1:2183915.09386218)
        305.748113140705, // AdV-Level 4  (1:1091957.54693109)
        152.874056570353, // AdV-Level 5  (1:545978.773465545)
        76.4370282851763, // AdV-Level 6  (1:272989,386732772)
        38.2185141425881, // AdV-Level 7  (1:136494,693366386)
        19.1092570712941, // AdV-Level 8  (1:68247,3466831931)
        9.55462853564703, // AdV-Level 9  (1:34123,6733415966)
        4.77731426782352, // AdV-Level 10 (1:17061,8366707983)
        2.38865713391176, // AdV-Level 11 (1:8530,91833539914)
        1.19432856695588, // AdV-Level 12 (1:4265,45916769957)
        0.59716428347794, // AdV-Level 13 (1:2132,72958384978)
        0.29858214173897 // AdV-Level 14  (1:1066,36479192489)
        // 0.14929107086949, //           (1:533,182395962445)
        // 0.07464553543475 //            (1:266,5911979812214)
    ];
    matrixIds = new Array(this.resolutions.length);

    async getMapConfig(): Promise<MapConfig> {
        for (let i = 0; i < this.resolutions.length; i++) {
            this.matrixIds[i] = i;
        }

        return {
            initialView: {
                kind: "position",
                center: { x: 404747, y: 5757920 },
                zoom: 14
            },
            projection: "EPSG:25832",
            layers: [
                {
                    id: "topplus_open",
                    title: "TopPlus Open",
                    isBaseLayer: true,
                    visible: true,
                    layer: new TileLayer({
                        source: new WMTS({
                            url: "https://www.wmts.nrw.de/topplus_open/tiles/topplus_col/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png",
                            layer: "topplus_col",
                            matrixSet: "EPSG_25832_14",
                            format: "image/png",
                            projection: "EPSG:25832",
                            requestEncoding: "REST",
                            tileGrid: new WMTSTileGrid({
                                origin: [-46133.17, 6301219.54],
                                resolutions: this.resolutions,
                                matrixIds: this.matrixIds
                            }),
                            style: "default"
                        })
                    })
                },
                {
                    id: "topplus_open_grau",
                    title: "TopPlus Open (Graustufen-Darstellung)",
                    isBaseLayer: true,
                    visible: true,
                    layer: new TileLayer({
                        source: new WMTS({
                            url: "https://www.wmts.nrw.de/topplus_open/tiles/topplus_grau/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png",
                            layer: "topplus_grau",
                            matrixSet: "EPSG_25832_14",
                            format: "image/png",
                            projection: "EPSG:25832",
                            requestEncoding: "REST",
                            tileGrid: new WMTSTileGrid({
                                origin: [-46133.17, 6301219.54],
                                resolutions: this.resolutions,
                                matrixIds: this.matrixIds.map((matrixId) => matrixId.identifier)
                            }),
                            style: "default"
                        })
                    })
                },
                {
                    id: "b-1",
                    title: "OSM",
                    isBaseLayer: true,
                    visible: false,
                    layer: new TileLayer({
                        source: new OSM()
                    })
                },
                {
                    title: "Watercolor",
                    visible: false,
                    layer: new TileLayer({
                        source: new Stamen({ layer: "watercolor" })
                    })
                },
                {
                    id: "b-2",
                    title: "Toner",
                    isBaseLayer: true,
                    visible: false,
                    layer: new TileLayer({
                        source: new Stamen({ layer: "toner" })
                    })
                }
            ]
        };
    }
}
