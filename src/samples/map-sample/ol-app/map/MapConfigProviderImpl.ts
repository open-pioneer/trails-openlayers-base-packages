// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LegendItemAttributes } from "@open-pioneer/legend";
import {
    BaseFeature,
    MapConfig,
    MapConfigProvider,
    SimpleLayer,
    WMSLayer,
    WMTSLayer
} from "@open-pioneer/map";
import { OgcFeaturesVectorSourceFactory } from "@open-pioneer/ogc-features";
import { ServiceOptions } from "@open-pioneer/runtime";
import { View } from "ol";
import GeoJSON from "ol/format/GeoJSON";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector";
import { OSM } from "ol/source";
import VectorSource from "ol/source/Vector";
import { Circle, Fill, Style } from "ol/style";
import { CustomLegendItem } from "./CustomLegendItems";

interface References {
    vectorSourceFactory: OgcFeaturesVectorSourceFactory;
}

/** The id of the default map instance. */
export const MAP_ID = "main";

/** Configures the map. The map is displayed in the React UI by the <MapContainer /> component. */
export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;
    private vectorSourceFactory: OgcFeaturesVectorSourceFactory;

    constructor(options: ServiceOptions<References>) {
        this.vectorSourceFactory = options.references.vectorSourceFactory;
    }

    async getMapConfig(): Promise<MapConfig> {
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
                ...createBaseLayers(),
                createStrassenLayer(),
                createKrankenhausLayer(this.vectorSourceFactory),
                createSchulenLayer(),
                createKitasLayer()
            ]
        };
    }
}

function createBaseLayers() {
    return [
        new WMTSLayer({
            isBaseLayer: true,
            title: "Topplus grau",
            url: "https://www.wmts.nrw.de/topplus_open/1.0.0/WMTSCapabilities.xml",
            name: "topplus_grau",
            matrixSet: "EPSG_25832_14",
            visible: false,
            sourceOptions: {
                attributions: `Kartendarstellung und Präsentationsgraphiken: &copy; Bundesamt für Kartographie und Geodäsie ${new Date().getFullYear()}, <a title="Datenquellen öffnen" aria-label="Datenquellen öffnen" href="https://sg.geodatenzentrum.de/web_public/gdz/datenquellen/Datenquellen_TopPlusOpen.html " target="_blank">Datenquellen</a>`
            }
        }),
        new WMTSLayer({
            isBaseLayer: true,
            title: "Topplus farbig",
            url: "https://www.wmts.nrw.de/topplus_open/1.0.0/WMTSCapabilities.xml",
            name: "topplus_col",
            matrixSet: "EPSG_25832_14",
            visible: true,
            sourceOptions: {
                attributions: `Kartendarstellung und Präsentationsgraphiken: &copy; Bundesamt für Kartographie und Geodäsie ${new Date().getFullYear()}, <a title="Datenquellen öffnen" aria-label="Datenquellen öffnen" href="https://sg.geodatenzentrum.de/web_public/gdz/datenquellen/Datenquellen_TopPlusOpen.html " target="_blank">Datenquellen</a>`
            }
        }),
        new SimpleLayer({
            title: "OpenStreetMaps",
            visible: false,
            isBaseLayer: true,
            olLayer: new TileLayer({
                source: new OSM()
            })
        })
    ];
}

function createKrankenhausLayer(vectorSourceFactory: OgcFeaturesVectorSourceFactory) {
    const baseURL = "https://ogc-api-test.nrw.de/inspire-us-krankenhaus/v1";
    const collectionId = "governmentalservice";
    const source = vectorSourceFactory.createVectorSource({
        strategy: "next",
        baseUrl: baseURL,
        collectionId: collectionId,
        limit: 1000,
        crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
        attributions: `Land NRW (${new Date().getFullYear()}), <a href='https://www.govdata.de/dl-de/by-2-0'>Datenlizenz Deutschland - Namensnennung - Version 2.0</a>, <a href='https://ogc-api-test.nrw.de/inspire-us-krankenhaus/v1'>Datenquelle</a>`
    });

    const layer = new VectorLayer({
        source: source
    });

    return new SimpleLayer({
        id: "krankenhaus",
        title: "Krankenhäuser",
        visible: false,
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
                    "legend": {}
                }
            }
        ],
        sourceOptions: {
            ratio: 1
        }
    });
}

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
                title: "Abschnitte und Äste"
            },
            {
                name: "6",
                title: "Unfälle"
            }
        ]
    });
}

function createKitasLayer() {
    const pointLayerLegendProps: LegendItemAttributes = {
        Component: CustomLegendItem
    };

    const geojsonSource = new VectorSource({
        url: "https://ogc-api.nrw.de/inspire-us-kindergarten/v1/collections/governmentalservice/items?f=json&limit=10000",
        format: new GeoJSON(), //assign GeoJson parser
        attributions:
            '&copy; <a href="http://www.bkg.bund.de" target="_blank">Bundesamt f&uuml;r Kartographie und Geod&auml;sie</a> 2017, <a href="http://sg.geodatenzentrum.de/web_public/Datenquellen_TopPlus_Open.pdf" target="_blank">Datenquellen</a>'
    });

    const vectorLayer = new VectorLayer({
        source: geojsonSource,
        style: new Style({
            image: new Circle({
                fill: new Fill({ color: "blue" }),
                radius: 4
            })
        })
    });

    return new SimpleLayer({
        id: "ogc_kitas",
        title: "Kindertagesstätten",
        visible: true,
        olLayer: vectorLayer,
        attributes: {
            // Standard property interpreted by the legend component.
            "legend": pointLayerLegendProps,

            // Custom attribute used in this application.
            // This is interpreted by this application when opening the  results in the result list.
            "resultListMetadata": [
                {
                    id: "id",
                    displayName: "ID",
                    width: 100,
                    getPropertyValue(feature: BaseFeature) {
                        return feature.id;
                    }
                },
                {
                    propertyName: "pointOfContact.address.postCode",
                    displayName: "PLZ",
                    width: 120
                },
                {
                    propertyName: "name",
                    displayName: "Name"
                },
                {
                    propertyName: "inspireId",
                    displayName: "inspireID"
                },
                {
                    displayName: "Gefördert",
                    width: 160,
                    getPropertyValue(feature: BaseFeature) {
                        switch (feature.properties?.gefoerdert) {
                            case "ja":
                                return true;
                            case "nein":
                                return false;
                            default:
                                return feature.properties?.gefoerdert;
                        }
                    }
                }
            ]
        }
    });
}
