// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { LineString, Point, Polygon } from "ol/geom";
import OlMap from "ol/Map";
import { Feature } from "ol";
import { boundingExtent, createEmpty, extend, getCenter } from "ol/extent";
import { Coordinate } from "ol/coordinate";
import { Circle, Fill, Icon, Stroke, Style } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import olMarkerUrl from "./images/olMarker.png?url";

export interface ResultHandlerOptions {
    /**
     * The olMap.
     */
    olMap: OlMap;

    /**
     * The layer shown in the overview map.
     */
    geometries: Point[] | LineString[] | Polygon[];

    /**
     * The zoomto-scale for point results
     */
    zoom?: number;

    /**
     * The zoomto-max-scale for polygon and line results.
     */
    maxZoom?: number;
}

/**
 * This function shows the position of a text search result zoomed to and marked or highlighted in the map.
 */
export function resultHandler(options: ResultHandlerOptions) {
    const { olMap, geometries, zoom, maxZoom } = options;

    if (!geometries || !geometries.length) {
        return;
    }

    if (geometries[0]?.getType() === "Point") {
        centerAndAddMarkers(olMap, geometries);
    } else {
        zoomAndHighlight(olMap, geometries);
    }
}

function centerAndAddMarkers(olMap: OlMap, points: Point[] | LineString[] | Polygon[]) {
    //todo: transform points to map-view proj. maybe this should be done in the parent or the source proj should be sent with
    let centerCoords;
    let extent;
    if (points.length === 1) {
        const point = points[0];
        centerCoords = point?.getCoordinates() as Coordinate;
    } else {
        const allCoords = points.map((point) => point.getCoordinates() as Coordinate);
        extent = boundingExtent(allCoords);
        centerCoords = getCenter(extent);
    }
    centerCoords && centerCoords.length && olMap.getView().setCenter(centerCoords);
    //todo: do we need to zoom also for point results?
    extent && olMap.getView().fit(extent, { maxZoom: 12 });

    createAndAddLayer(olMap, "Point", points);
}

function zoomAndHighlight(olMap: OlMap, geometries: Point[] | LineString[] | Polygon[]) {
    console.log(geometries);

    const type = geometries[0]?.getType() === "Polygon" ? "Polygon" : "Linestring";
    const extent = createEmpty();
    geometries.forEach((geometry) => {
        extend(extent, geometry.getExtent());
    });
    olMap.getView().fit(extent, { maxZoom: 12 }); //todo: check buffer(extent, value, dest)
    createAndAddLayer(olMap, type, geometries);
}

function createAndAddLayer(
    olMap: OlMap,
    geomType: string,
    geometries: Point[] | LineString[] | Polygon[]
) {
    const pointFeatures = geometries.map((geometry) => {
        return new Feature({
            type: geomType,
            geometry: geometry
        });
    });
    const layer = new VectorLayer({
        className: "highlighted_layer",
        source: new VectorSource({
            features: pointFeatures
        }),
        style: function (feature) {
            console.log(feature);
            const type: keyof typeof styles = feature.get("type");
            return styles[type];
        }
    });
    removeMarkerOrHighlight(olMap);
    olMap.addLayer(layer);
    //todo: if zoom-to-extent is also for point results, move fit(extent) here. and use "extent = layer.getSource().getExtent()".
}

function removeMarkerOrHighlight(olMap: OlMap) {
    const layer = olMap
        .getLayers()
        .getArray()
        .find((l) => l.getClassName().includes("highlighted_layer"));
    layer && olMap.removeLayer(layer);
}
//todo: how to add directory for image
const styles = {
    "Point": new Style({
        image: new Icon({
            anchor: [0.5, 1],
            src: olMarkerUrl
        })
    }),
    "Linestring": new Style({
        stroke: new Stroke({
            width: 6,
            color: "blue"
        })
    }),
    "Polygon": new Style({
        stroke: new Stroke({
            width: 6,
            color: "blue"
        })
    })
};
