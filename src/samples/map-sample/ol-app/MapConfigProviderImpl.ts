// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider } from "@open-pioneer/map";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Source from "ol/source/Vector";
import OSM from "ol/source/OSM";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import GeoJSON from "ol/format/GeoJSON";
import { bbox } from "ol/loadingstrategy";

export const MAP_ID = "main";
const vectorSource = new VectorSource({
    format: new GeoJSON(),
    loader: function (extent, resolution, projection, success, failure) {
        const url =
            "https://ogc-api.nrw.de/lika/v1/collections/katasterbezirk/items?limit=1000000&bbox=" +
            extent.join(",") +
            "&bbox-crs=http://www.opengis.net/def/crs/EPSG/0/25832" +
            "&crs=http://www.opengis.net/def/crs/EPSG/0/25832";
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        const onError = function () {
            vectorSource.removeLoadedExtent(extent);
            failure!(); // Todo: Typescript types!
        };
        xhr.onerror = onError;
        xhr.onload = function () {
            if (xhr.status == 200) {
                const getFormat = vectorSource.getFormat();
                if (getFormat) {
                    const features = new GeoJSON({
                        featureProjection: "EPSG:25832"
                    }).readFeatures(xhr.responseText);
                    vectorSource.addFeatures(features);
                }
            } else {
                onError();
            }
        };
        xhr.send();
    },
    strategy: bbox
});

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig(): Promise<MapConfig> {
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
                        source: createWMTSSource("web")
                    })
                },
                {
                    id: "topplus_open_grau",
                    title: "TopPlus Open (Grau)",
                    isBaseLayer: true,
                    visible: false,
                    layer: new TileLayer({
                        source: createWMTSSource("web_grau")
                    })
                },
                {
                    id: "test_ogc_katasterbezirk",
                    title: "OGC API Katasterbezirk",
                    isBaseLayer: false,
                    visible: true,
                    layer: new VectorLayer({
                        source: vectorSource
                    })
                } /*,
                {
                    id: "test_ogc_nutzung",
                    title: "OGC API Nutzung",
                    isBaseLayer: false,
                    visible: true,
                    layer: new VectorLayer({
                        source: new VectorSource({
                            features: new GeoJSON().readFeatures(
                                await fetch(
                                    "https://ogc-api.nrw.de/lika/v1/collections/nutzung/items",
                                    {
                                        headers: {
                                            Accept: "application/geo+json"
                                        }
                                    }
                                ).then((response) => response.json()),
                                { featureProjection: "EPSG:25832" }
                            ),
                            attributions: "Test Nutzung"
                        })
                    })
                },
                {
                    id: "test_ogc_nutzung_flurstueck",
                    title: "OGC API Nutzung Flurstück",
                    isBaseLayer: true,
                    visible: true,
                    layer: new VectorLayer({
                        source: new VectorSource({
                            features: new GeoJSON().readFeatures(
                                await fetch(
                                    "https://ogc-api.nrw.de/lika/v1/collections/nutzung_flurstueck/items",
                                    {
                                        headers: {
                                            Accept: "application/geo+json"
                                        }
                                    }
                                ).then((response) => response.json()),
                                { featureProjection: "EPSG:25832" }
                            ),
                            attributions: "Test Nutzung Flurstück"
                        })
                    })
                },
                {
                    id: "test_ogc_verwaltungseinheit",
                    title: "OGC API Verwaltungseinheit",
                    isBaseLayer: true,
                    visible: false,
                    layer: new VectorLayer({
                        source: new VectorSource({
                            features: new GeoJSON().readFeatures(
                                await fetch(
                                    "https://ogc-api.nrw.de/lika/v1/collections/verwaltungseinheit/items?limit=10000",
                                    {
                                        headers: {
                                            Accept: "application/geo+json"
                                        }
                                    }
                                ).then((response) => response.json()),
                                { featureProjection: "EPSG:25832" }
                            ),
                            attributions: "Test Verwaltungseinheit"
                        })
                    })
                },
                {
                    id: "test_ogc_abschnitteaeste",
                    title: "OGC API Abschnitte und Äste",
                    isBaseLayer: true,
                    visible: true,
                    layer: new VectorLayer({
                        source: new VectorSource({
                            features: new GeoJSON().readFeatures(
                                await fetch(
                                    "https://demo.ldproxy.net/strassen/collections/abschnitteaeste/items",
                                    {
                                        headers: {
                                            Accept: "application/geo+json"
                                        }
                                    }
                                ).then((response) => response.json()),
                                { featureProjection: "EPSG:25832" }
                            ),
                            attributions: "Test Abschnitte und Äste"
                        })
                    })
                },
                {
                    id: "test_ogc_ETL",
                    title: "OGC API Electricity Emission Lines",
                    isBaseLayer: true,
                    visible: true,
                    layer: new VectorLayer({
                        source: new VectorSource({
                            features: new GeoJSON().readFeatures(
                                await fetch(
                                    "https://demo.ldproxy.net/zoomstack/collections/etl/items",
                                    {
                                        headers: {
                                            Accept: "application/geo+json"
                                        }
                                    }
                                ).then((response) => response.json()),
                                { featureProjection: "EPSG:25832" }
                            ),
                            attributions: "Test Electricity Emission Lines"
                        })
                    })
                },
                */,
                {
                    id: "b-1",
                    title: "OSM",
                    isBaseLayer: true,
                    visible: false,
                    layer: new TileLayer({
                        source: createWMTSSource("web_light")
                    })
                },
                {
                    title: "OSM",
                    visible: false,
                    isBaseLayer: true,
                    layer: new TileLayer({
                        source: new OSM()
                    })
                }
            ]
        };
    }
}

/**
 * This method demonstrates how to integrate a WMTS-Service using
 * advanced predefined configuration.
 *
 * For more details, see the documentation of the map package.
 */
function createWMTSSource(layer: "web" | "web_grau" | "web_light") {
    const topLeftCorner = [-3803165.98427299, 8805908.08284866];

    /**
     * Resolutions taken from AdV WMTS-Profil
     * @see https://www.adv-online.de/AdV-Produkte/Standards-und-Produktblaetter/AdV-Profile/
     */
    const resolutions = [
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
        0.59716428347794 // AdV-Level 13 (1:2132,72958384978)
    ];

    /**
     * The length of matrixIds needs to match the length of the resolutions array
     * @see https://openlayers.org/en/latest/apidoc/module-ol_tilegrid_WMTS-WMTSTileGrid.html
     */
    const matrixIds = new Array(resolutions.length);
    for (let i = 0; i < resolutions.length; i++) {
        matrixIds[i] = i;
    }

    return new WMTS({
        url: `https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/${layer}/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png`,
        layer: "web_grau",
        matrixSet: "EU_EPSG_25832_TOPPLUS",
        format: "image/png",
        projection: "EPSG:25832",
        requestEncoding: "REST",
        tileGrid: new WMTSTileGrid({
            origin: topLeftCorner,
            resolutions: resolutions,
            matrixIds: matrixIds
        }),
        style: "default",
        attributions: `Kartendarstellung und Präsentationsgraphiken: © Bundesamt für Kartographie und Geodäsie ${new Date().getFullYear()}, <a href="https://sg.geodatenzentrum.de/web_public/gdz/datenquellen/Datenquellen_TopPlusOpen.html" target="_blank">Datenquellen</a>`
    });
}
