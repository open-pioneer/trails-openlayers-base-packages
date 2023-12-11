// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider, SimpleLayer } from "@open-pioneer/map";
import { createVectorSource } from "@open-pioneer/ogc-features";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import { Circle, Fill, Stroke, Style } from "ol/style";
import { MapboxVectorLayer } from "ol-mapbox-style";
import { MVT } from "ol/format";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";

export const MAP_ID = "main";

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig(): Promise<MapConfig> {
        return {
            projection: "EPSG:3857",
            initialView: {
                kind: "position",
                center: {
                    x: 848890,
                    y: 6793350
                },
                zoom: 13
            },
            layers: [
                new SimpleLayer({
                    title: "OSM",
                    visible: true,
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                }),
                new SimpleLayer({
                    id: "inspire-us-kindergarten",
                    title: "Kindertageseinrichtungen in NRW",
                    visible: true,
                    olLayer: new VectorLayer({
                        style: new Style({
                            image: new Circle({
                                fill: new Fill({ color: "blue" }),
                                radius: 5
                            })
                        }),
                        source: createVectorSource({
                            baseUrl: "https://ogc-api.nrw.de/inspire-us-kindergarten/v1",
                            collectionId: "governmentalservice",
                            crs: "http://www.opengis.net/def/crs/EPSG/0/3857",
                            attributions:
                                "<a href='https://www.govdata.de/dl-de/by-2-0'>Datenlizenz Deutschland - Namensnennung - Version 2.0</a>"
                        })
                    })
                }),
                new SimpleLayer({
                    id: "ogc_katasterbezirk",
                    title: "Liegenschaftskatasterbezirke in NRW (viele Daten)",
                    visible: false,
                    olLayer: new VectorLayer({
                        source: createVectorSource({
                            baseUrl: "https://ogc-api.nrw.de/lika/v1",
                            collectionId: "katasterbezirk",
                            limit: 1000,
                            crs: "http://www.opengis.net/def/crs/EPSG/0/3857",
                            attributions:
                                "<a href='https://www.govdata.de/dl-de/by-2-0'>Datenlizenz Deutschland - Namensnennung - Version 2.0</a>"
                        })
                    })
                }),
                new SimpleLayer({
                    title: "Abschnitte / Äste mit Unfällen (Mapbox Style)",
                    visible: false,
                    olLayer: new MapboxVectorLayer({
                        styleUrl: "https://demo.ldproxy.net/strassen/styles/default?f=mbs"
                    })
                }),
                new SimpleLayer({
                    title: "Pendleratlas",
                    visible: true,
                    olLayer: new VectorTileLayer({
                        source: new VectorTileSource({
                            url: "https://pendleratlas.statistikportal.de/_vector_tiles/2022/vg250/{z}/{x}/{y}.pbf",
                            format: new MVT(),
                            projection: "EPSG:3857",
                            attributions: `&copy; Statistische Ämter der Länder ${new Date().getFullYear()} | GeoBasis-DE/BKG ${new Date().getFullYear()}`
                        }),
                        // demonstration of simple styling; using a Mapbox Style is shown in the layer above
                        style: new Style({
                            fill: new Fill({
                                color: "rgba(173, 209, 158, 0.6)"
                            }),
                            stroke: new Stroke({
                                color: "#2d7d9f",
                                width: 3
                            })
                        })
                    })
                })
            ]
        };
    }
}
