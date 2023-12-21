// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider, SimpleLayer } from "@open-pioneer/map";
import VectorSource from "ol/source/Vector";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import { Circle, Fill, Style } from "ol/style";
import GeoJSON from "ol/format/GeoJSON";
import { keycloak } from "./services";

export const MAP_ID = "main";
const query =
    "https://hsi-pex0-13620.service.it.nrw.de/xtraserver-webapi/inspire-us-krankenhaus/v1/collections/governmentalservice/items?f=json&limit=5000&crs=http://www.opengis.net/def/crs/EPSG/0/3857";
const vectorSource = new VectorSource({
    format: new GeoJSON({}),
    loader: function (extent, resolution, projection, onSuccess, onError) {
        fetch(query, {
            headers: {
                Authorization: "Bearer " + keycloak.token
            }
        }).then((response) => {
            if (response.ok) {
                response.json().then((json) => {
                    const features = new GeoJSON({}).readFeatures(json);
                    vectorSource.addFeatures(features);
                    if (onSuccess) onSuccess(features);
                });
            } else {
                response.text().then(() => {
                    if (onError) onError();
                });
            }
        });
    }
});
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
                    title: "Krakenhäuser in NRW",
                    visible: true,
                    olLayer: new VectorLayer({
                        style: new Style({
                            image: new Circle({
                                fill: new Fill({ color: "blue" }),
                                radius: 5
                            })
                        }),
                        source: vectorSource
                    })
                })
            ]
        };
    }
}
