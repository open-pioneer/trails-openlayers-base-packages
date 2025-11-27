// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SimpleLayer, type Layer, type MapConfigProvider, type MapConfig } from "@open-pioneer/map";

import { Vector as VectorLayer, Tile as TileLayer } from "ol/layer";
import { OSM } from "ol/source";
import { Circle, Fill, Stroke, Style } from "ol/style";
import type { StyleLike } from "ol/style/Style";

import { createStore } from "./getStore";
import { IDBVectorSource } from "./IDBVectorSource";

export class MainMapProvider implements MapConfigProvider {
    async getMapConfig(): Promise<MapConfig> {
        return {
            ...MainMapProvider.MAP_SETTINGS,
            layers: [this.createOSMLayer(), ...this.createIDBLayers()]
        };
    }

    get mapId(): string {
        return MAP_ID;
    }

    private createOSMLayer(): Layer {
        return new SimpleLayer({
            title: "OpenStreetMap",
            olLayer: new TileLayer({
                source: new OSM(),
                properties: {
                    title: "OSM"
                }
            }),
            isBaseLayer: true
        });
    }

    private createIDBLayers(): Layer[] {
        return MainMapProvider.LAYER_CONFIG.map(({ id, title, style }) => {
            const store = createStore(id);

            return new SimpleLayer({
                id,
                title,
                visible: true,
                olLayer: new VectorLayer({
                    source: new IDBVectorSource(store),
                    style,
                    updateWhileAnimating: true,
                    updateWhileInteracting: true,
                    properties: { id, title }
                })
            });
        });
    }

    private static readonly MAP_SETTINGS: Omit<MapConfig, "layers"> = {
        initialView: {
            kind: "position",
            center: {
                x: 847541,
                y: 6793584
            },
            zoom: 14
        },
        projection: "EPSG:3857"
    };

    private static readonly LAYER_CONFIG: IDBLayerInfo[] = [
        {
            id: "waldschaeden",
            title: "Waldschäden",
            style: new Style({
                image: new Circle({
                    fill: new Fill({
                        color: "red"
                    }),
                    stroke: new Stroke({
                        color: "black",
                        width: 1.0
                    }),
                    radius: 10.0
                })
            })
        },
        {
            id: "waldwege",
            title: "Waldwege",
            style: new Style({
                stroke: new Stroke({
                    color: "blue",
                    width: 3.0
                })
            })
        },
        {
            id: "schutzgebiete",
            title: "Schutzgebiete",
            style(feature) {
                const color = feature.get("farbe");
                return new Style({
                    fill: new Fill({
                        color: color != null ? `${color}aa` : "#808080aa"
                    }),
                    stroke: new Stroke({
                        color: "black",
                        width: 1.0
                    })
                });
            }
        },
        {
            id: "bodenproben",
            title: "Bodenproben",
            style: new Style({
                fill: new Fill({
                    color: "#ffa500aa"
                }),
                stroke: new Stroke({
                    color: "black",
                    width: 1.0
                })
            })
        },
        {
            id: "aufforstungsflaechen",
            title: "Aufforstungsflächen",
            style: new Style({
                fill: new Fill({
                    color: "#00aa00aa"
                }),
                stroke: new Stroke({
                    color: "black",
                    width: 1.0
                })
            })
        }
    ];
}

export const MAP_ID = "main";

interface IDBLayerInfo {
    readonly id: LayerId;
    readonly title: string;
    readonly style: StyleLike;
}

export type LayerId =
    | "waldschaeden"
    | "waldwege"
    | "schutzgebiete"
    | "bodenproben"
    | "aufforstungsflaechen";
