// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider, SimpleLayerModel } from "@open-pioneer/map";
import { createVectorSource } from "@open-pioneer/ogc-features";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import { Circle, Fill, Style } from "ol/style";

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
            projection: "EPSG:25832",
            layers: [
                new SimpleLayerModel({
                    title: "OSM",
                    visible: true,
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                }),
                new SimpleLayerModel({
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
                            crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                            attributions:
                                "<a href='https://www.govdata.de/dl-de/by-2-0'>Datenlizenz Deutschland - Namensnennung - Version 2.0</a>"
                        })
                    })
                }),
                new SimpleLayerModel({
                    id: "ogc_katasterbezirk",
                    title: "Liegenschaftskatasterbezirke in NRW (viele Daten)",
                    visible: false,
                    olLayer: new VectorLayer({
                        source: createVectorSource({
                            baseUrl: "https://ogc-api.nrw.de/lika/v1",
                            collectionId: "katasterbezirk",
                            crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                            attributions:
                                "<a href='https://www.govdata.de/dl-de/by-2-0'>Datenlizenz Deutschland - Namensnennung - Version 2.0</a>"
                        })
                    })
                })
            ]
        };
    }
}
