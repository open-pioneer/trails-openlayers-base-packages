// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider, SimpleLayer, WMSLayer, WMTSLayer } from "@open-pioneer/map";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { LegendItemAttributes } from "@open-pioneer/legend";
import { CustomLegend, LoremIpsumLegend } from "./CustomLegend";
import { OSM } from "ol/source";
import { Circle, Fill, Style } from "ol/style";
import TileLayer from "ol/layer/Tile.js";
import { ServiceOptions } from "@open-pioneer/runtime";
import { OgcFeaturesVectorSourceFactory } from "@open-pioneer/ogc-features";

interface References {
    vectorSourceFactory: OgcFeaturesVectorSourceFactory;
}
export const MAP_ID = "main";

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;
    private vectorSourceFactory: OgcFeaturesVectorSourceFactory;

    constructor(options: ServiceOptions<References>) {
        this.vectorSourceFactory = options.references.vectorSourceFactory;
    }

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
                new WMTSLayer({
                    isBaseLayer: true,
                    title: "Topplus grau",
                    url: "https://www.wmts.nrw.de/topplus_open/1.0.0/WMTSCapabilities.xml",
                    name: "topplus_grau",
                    matrixSet: "EPSG_25832_14",
                    visible: false
                }),

                new WMTSLayer({
                    isBaseLayer: true,
                    title: "Topplus farbig",
                    url: "https://www.wmts.nrw.de/topplus_open/1.0.0/WMTSCapabilities.xml",
                    name: "topplus_col",
                    matrixSet: "EPSG_25832_14",
                    visible: false
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
                    id: "ogc_kitas",
                    title: "Kindertagesstätten",
                    visible: true,
                    olLayer: createKitasLayer(),
                    attributes: {
                        "legend": pointLayerLegendProps
                    }
                }),
                new SimpleLayer({
                    id: "ogc_kataster",
                    title: "Liegenschaftskatasterbezirke in NRW (viele Daten)",
                    visible: false,
                    olLayer: createKatasterLayer(this.vectorSourceFactory)
                }),
                createKrankenhausLayer(this.vectorSourceFactory),
                createSchulenLayer(),
                createStrassenLayer(),
                createAdminAreasNRW(),
                createIsBk5Layer()
            ]
        };
    }
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
        source: geojsonSource,
        style: new Style({
            image: new Circle({
                fill: new Fill({ color: "blue" }),
                radius: 4
            })
        })
    });
}

function createKatasterLayer(vectorSourceFactory: OgcFeaturesVectorSourceFactory) {
    const source = vectorSourceFactory.createVectorSource({
        baseUrl: "https://ogc-api.nrw.de/lika/v1",
        collectionId: "katasterbezirk",
        limit: 1000,
        crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
        attributions:
            "<a href='https://www.govdata.de/dl-de/by-2-0'>Datenlizenz Deutschland - Namensnennung - Version 2.0</a>"
    });

    return new VectorLayer({
        source: source
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

function createKrankenhausLayer(vectorSourceFactory: OgcFeaturesVectorSourceFactory) {
    const baseURL = "https://ogc-api-test.nrw.de/inspire-us-krankenhaus/v1";
    const collectionId = "governmentalservice";
    const source = vectorSourceFactory.createVectorSource({
        baseUrl: baseURL,
        collectionId: collectionId,
        limit: 1000,
        crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
        attributions: "" // todo
    });

    const layer = new VectorLayer({
        source: source
    });

    return new SimpleLayer({
        id: "krankenhaus",
        title: "Krankenhäuser",
        visible: true,
        olLayer: layer,
        attributes: {
            collectionURL: baseURL + "/collections/" + collectionId
        }
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
