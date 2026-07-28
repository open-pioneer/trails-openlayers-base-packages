// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import {
    MapConfig,
    MapConfigProvider,
    MapConfigProviderOptions,
    SimpleLayer,
    WMTSLayer
} from "@open-pioneer/map";
import { Feature } from "ol";
import type { Coordinate } from "ol/coordinate";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Circle, Fill, Stroke, Style } from "ol/style";

export const MAP_ID = "main";

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig({ layerFactory }: MapConfigProviderOptions): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 404747, y: 5757920 },
                zoom: 13
            },
            projection: "EPSG:25832",
            layers: [
                layerFactory.create({
                    type: WMTSLayer,
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
                layerFactory.create({
                    type: SimpleLayer,
                    id: PLACES_LAYER_ID,
                    title: "Places (vector layer)",
                    visible: true,
                    olLayer: createPlacesLayer()
                })
            ]
        };
    }
}

/** Id of the vector layer used by the `VectorLayerSelectionSource`. */
export const PLACES_LAYER_ID = "places";

/** A place that can be selected in this app. */
interface DemoPlace {
    name: string;
    coordinates: Coordinate;
}

/**
 * A few (approximate) locations in Münster, in the projection of the map (`EPSG:25832`).
 */
const DEMO_PLACES: DemoPlace[] = [
    { name: "Schloss", coordinates: [404740, 5757893] },
    { name: "Dom St. Paulus", coordinates: [404960, 5757400] },
    { name: "Prinzipalmarkt", coordinates: [405100, 5757550] },
    { name: "Hauptbahnhof", coordinates: [406100, 5757600] },
    { name: "Aasee", coordinates: [404100, 5756500] },
    { name: "Allwetterzoo", coordinates: [403500, 5756800] },
    { name: "Stadthafen", coordinates: [406100, 5756900] },
    { name: "Universitätsklinikum", coordinates: [403900, 5758200] }
];

function createPlacesLayer(): VectorLayer<VectorSource, Feature> {
    const features = DEMO_PLACES.map((place, index) => {
        const feature = new Feature({
            geometry: new Point(place.coordinates),
            name: place.name
        });
        feature.setId(`place-${index}`);
        return feature;
    });

    return new VectorLayer({
        source: new VectorSource({ features }),
        style: new Style({
            image: new Circle({
                radius: 7,
                fill: new Fill({ color: "rgba(49, 130, 206, 0.9)" }),
                stroke: new Stroke({ color: "white", width: 2 })
            })
        })
    });
}
