// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider, SimpleLayer, WMSLayer, WMTSLayer } from "@open-pioneer/map";
import GeoJSON from "ol/format/GeoJSON";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import { LegendItemAttributes } from "@open-pioneer/legend";
import { CustomLegend, LoremIpsumLegend } from "./CustomLegend";
import { OSM } from "ol/source";

export const MAP_ID = "main";

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig(): Promise<MapConfig> {
        //const computedValue = "foo"; TODO add good examples for layerLegendProps

        const pointLayerLegendProps: LegendItemAttributes = {
            Component: CustomLegend
        };

        return {
            initialView: {
                kind: "position",
                center: { x: 404747, y: 5757920 },
                zoom: 14
            },
            projection: "EPSG:25832",
            layers: [
                new WMSLayer({
                    title: "Linfos",
                    visible: true,
                    url: "http://www.wms.nrw.de/umwelt/linfos",
                    sublayers: [
                        {
                            name: "SonstigeSchutzgebiete",
                            title: "SonstigeSchutzgebiete"
                        },
                        {
                            name: "SCH_GSG",
                            title: "SCH_GSG"
                        }
                    ]
                }),
                new SimpleLayer({
                    id: "topplus_open",
                    title: "TopPlus Open",
                    isBaseLayer: true,
                    visible: true,
                    olLayer: createTopPlusOpenLayer("web"),
                    attributes: {
                        "legend": {
                            imageUrl:
                                "https://sg.geodatenzentrum.de/wms_topplus_open?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=web"
                        }
                    }
                }),
                new SimpleLayer({
                    id: "topplus_open_grau",
                    title: "TopPlus Open (Grau)",
                    isBaseLayer: true,
                    visible: false,
                    olLayer: createTopPlusOpenLayer("web_grau"),
                    attributes: {
                        "legend": {
                            imageUrl:
                                "https://sg.geodatenzentrum.de/wms_topplus_open?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=web_grau"
                        }
                    }
                }),
                new SimpleLayer({
                    id: "topplus_open_light",
                    title: "TopPlus Open (Light)",
                    isBaseLayer: true,
                    visible: false,
                    olLayer: createTopPlusOpenLayer("web_light"),
                    attributes: {
                        "legend": {
                            imageUrl:
                                "https://sg.geodatenzentrum.de/wms_topplus_open?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=web_light"
                        }
                    }
                }),
                new SimpleLayer({
                    title: "OSM",
                    visible: false,
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                }),
                new SimpleLayer({
                    title: "Haltestellen Stadt Rostock",
                    visible: true,
                    description:
                        "Haltestellen des öffentlichen Personenverkehrs in der Hanse- und Universitätsstadt Rostock.",
                    olLayer: createHaltestellenLayer(),
                    attributes: {
                        "legend": pointLayerLegendProps
                    }
                }),
                new SimpleLayer({
                    title: "Kindertagesstätten",
                    visible: true,
                    olLayer: createKitasLayer(),
                    attributes: {
                        "legend": pointLayerLegendProps
                    }
                }),
                createSchulenLayer(),
                createStrassenLayer(),
                createAdminAreasNRW(),
                createIsBk5Layer()
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
function createTopPlusOpenLayer(layer: "web" | "web_grau" | "web_light") {
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

    const wmts = new WMTS({
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
    return new TileLayer({
        source: wmts
    });
}

function createHaltestellenLayer() {
    const geojsonSource = new VectorSource({
        url: "https://geo.sv.rostock.de/download/opendata/haltestellen/haltestellen.json",
        format: new GeoJSON(), //assign GeoJson parser
        attributions: "Haltestellen Stadt Rostock, Creative Commons CC Zero License (cc-zero)"
    });

    return new VectorLayer({
        source: geojsonSource
    });
}

function createKitasLayer() {
    const geojsonSource = new VectorSource({
        url: "https://ogc-api.nrw.de/inspire-us-kindergarten/v1/collections/governmentalservice/items?f=json&limit=10000",
        format: new GeoJSON(), //assign GeoJson parser
        attributions:
            '&copy; <a href="http://www.bkg.bund.de" target="_blank">Bundesamt f&uuml;r Kartographie und Geod&auml;sie</a> 2017, <a href="http://sg.geodatenzentrum.de/web_public/Datenquellen_TopPlus_Open.pdf" target="_blank">Datenquellen</a>'
    });

    return new VectorLayer({
        source: geojsonSource
    });
}
function createAdminAreasNRW() {
    return new WMSLayer({
        title: "Verwaltungsgebiete",
        visible: true,
        url: "https://www.wms.nrw.de/geobasis/wms_nw_dvg",
        sublayers: [
            {
                name: "nw_dvg_bld",
                title: "NRW"
            }
        ]
    });
}

function createIsBk5Layer() {
    return new WMSLayer({
        title: "Bodenkarte zur Landwirtschaftlichen Standorterkundung",
        visible: true,
        url: "https://www.wms.nrw.de/gd/bk05l",
        sublayers: [
            {
                name: "Versickerung_und_Stofftransport",
                title: "Versickerung und Stofftransport",
                sublayers: [
                    {
                        name: "Sickerwasserrate",
                        title: "Sickerwasserrate",
                        sublayers: [
                            {
                                name: "Szenario_Wald",
                                title: "Szenario Wald",
                                sublayers: [
                                    {
                                        name: "Sickerwasserrate_Wald",
                                        title: "Sickerwasserrate Wald"
                                    },
                                    {
                                        name: "Direktabfluss_Wald",
                                        title: "Direktabfluss Wald"
                                    }
                                ]
                            },
                            {
                                name: "Szenario_Gruenland",
                                title: "Szenario Grünland",
                                sublayers: [
                                    {
                                        name: "Sickerwasserrate_Gruenland",
                                        title: "Sickerwasserrate Grünland"
                                    },
                                    {
                                        name: "Direktabfluss_Gruenland",
                                        title: "Direktabfluss Grünland"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                name: "Wasserhaushalt",
                title: "Wasserhaushalt",
                sublayers: [
                    {
                        name: "Kapillaraufstieg_von_Grundwasser",
                        title: "Kapillaraufstieg von Grundwasser",
                        attributes: {
                            "legend": {
                                imageUrl:
                                    "https://www.wms.nrw.de/gd/bk05l?request=GetLegendGraphic%26version=1.3.0%26format=image/png%26layer=Kapillaraufstieg_von_Grundwasser"
                            }
                        }
                    },
                    {
                        name: "Luftkapazitaet_We",
                        title: "Luftkapazitaet (We)",
                        attributes: {
                            "legend": {
                                imageUrl:
                                    "https://avatars.githubusercontent.com/u/121286957?s=200&v=4"
                            }
                        }
                    }
                ]
            }
        ]
    });
}

function createSchulenLayer() {
    return new WMSLayer({
        title: "Schulstandorte",
        description: `Der vorliegende Datenbestand / Dienst zu den Schulstandorten in NRW stammt aus der Schuldatenbank. Die Informationen werden von den Schulträgern bzw. Schulen selbst eingetragen und aktuell gehalten. Die Daten werden tagesaktuell bereitgestellt und enthalten alle grundlegenden Informationen zu Schulen wie Schulnummer, Schulbezeichnung und Adresse.Der vorliegende Datenbestand / Dienst zu den Schulstandorten in NRW stammt aus der Schuldatenbank. Die Informationen werden von den Schulträgern bzw. Schulen selbst eingetragen und aktuell gehalten. Die Daten werden tagesaktuell bereitgestellt und enthalten alle grundlegenden Informationen zu Schulen wie Schulnummer, Schulbezeichnung und Adresse.Der vorliegende Datenbestand / Dienst zu den Schulstandorten in NRW stammt aus der Schuldatenbank. Die Informationen werden von den Schulträgern bzw. Schulen selbst eingetragen und aktuell gehalten. Die Daten werden tagesaktuell bereitgestellt und enthalten alle grundlegenden Informationen zu Schulen wie Schulnummer, Schulbezeichnung und Adresse.Der vorliegende Datenbestand / Dienst zu den Schulstandorten in NRW stammt aus der Schuldatenbank. Die Informationen werden von den Schulträgern bzw. Schulen selbst eingetragen und aktuell gehalten. Die Daten werden tagesaktuell bereitgestellt und enthalten alle grundlegenden Informationen zu Schulen wie Schulnummer, Schulbezeichnung und Adresse.`,
        visible: true,
        url: "https://www.wms.nrw.de/wms/wms_nw_inspire-schulen",
        sublayers: [
            {
                name: "US.education",
                title: "INSPIRE - WMS Schulstandorte NRW",
                attributes: {
                    "legend": {
                        imageUrl: "https://avatars.githubusercontent.com/u/121286957?s=200&v=4"
                    }
                }
            }
        ],
        sourceOptions: {
            ratio: 1
        }
    });
}

const loremIpsum: LegendItemAttributes = {
    Component: LoremIpsumLegend
};

function createStrassenLayer() {
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
                title: "Abschnitte und Äste",
                attributes: {
                    "legend": loremIpsum
                }
            },
            {
                name: "6",
                title: "Unfälle"
            }
        ]
    });
}
