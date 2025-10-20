// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    GroupLayer,
    LayerFactory,
    MapConfig,
    MapConfigProvider,
    MapConfigProviderOptions,
    SimpleLayer,
    WMSLayer
} from "@open-pioneer/map";
import GeoJSON from "ol/format/GeoJSON";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";

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
                    type: SimpleLayer,
                    title: "OSM",
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    title: "Kindertagesstätten",
                    id: "kitas",
                    olLayer: createKitasLayer()
                }),
                createSchulenLayer(layerFactory),
                layerFactory.create({
                    type: GroupLayer,
                    title: "Verkehr",
                    id: "transport",
                    layers: [
                        layerFactory.create({
                            type: SimpleLayer,
                            title: "Haltestellen Stadt Rostock",
                            description:
                                "Haltestellen des öffentlichen Personenverkehrs in der Hanse- und Universitätsstadt Rostock.",
                            olLayer: createHaltestellenLayer()
                        }),
                        createStrassenLayer(layerFactory)
                    ]
                })
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
        source: geojsonSource
    });
}

function createSchulenLayer(layerFactory: LayerFactory) {
    return layerFactory.create({
        type: WMSLayer,
        title: "Schulstandorte",
        id: "schools",
        description: `Der vorliegende Datenbestand / Dienst zu den Schulstandorten in NRW stammt aus der Schuldatenbank. Die Informationen werden von den Schulträgern bzw. Schulen selbst eingetragen und aktuell gehalten. Die Daten werden tagesaktuell bereitgestellt und enthalten alle grundlegenden Informationen zu Schulen wie Schulnummer, Schulbezeichnung und Adresse.Der vorliegende Datenbestand / Dienst zu den Schulstandorten in NRW stammt aus der Schuldatenbank. Die Informationen werden von den Schulträgern bzw. Schulen selbst eingetragen und aktuell gehalten. Die Daten werden tagesaktuell bereitgestellt und enthalten alle grundlegenden Informationen zu Schulen wie Schulnummer, Schulbezeichnung und Adresse.Der vorliegende Datenbestand / Dienst zu den Schulstandorten in NRW stammt aus der Schuldatenbank. Die Informationen werden von den Schulträgern bzw. Schulen selbst eingetragen und aktuell gehalten. Die Daten werden tagesaktuell bereitgestellt und enthalten alle grundlegenden Informationen zu Schulen wie Schulnummer, Schulbezeichnung und Adresse.Der vorliegende Datenbestand / Dienst zu den Schulstandorten in NRW stammt aus der Schuldatenbank. Die Informationen werden von den Schulträgern bzw. Schulen selbst eingetragen und aktuell gehalten. Die Daten werden tagesaktuell bereitgestellt und enthalten alle grundlegenden Informationen zu Schulen wie Schulnummer, Schulbezeichnung und Adresse.`,
        url: "https://www.wms.nrw.de/wms/wms_nw_inspire-schulen",
        sublayers: [
            {
                name: "US.education",
                title: "INSPIRE - WMS Schulstandorte NRW"
            }
        ],
        sourceOptions: {
            ratio: 1
        }
    });
}

function createStrassenLayer(layerFactory: LayerFactory) {
    return layerFactory.create({
        type: WMSLayer,
        id: "streets",
        title: "Straßennetz Landesbetrieb Straßenbau NRW",
        url: "https://www.wms.nrw.de/wms/strassen_nrw_wms",
        sublayers: [
            {
                name: "1",
                title: "Verwaltungen"
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
