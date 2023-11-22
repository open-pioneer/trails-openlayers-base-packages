// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { LineString, Point, Polygon } from "ol/geom";
import OlMap from "ol/Map";
import { Feature } from "ol";
import {
    boundingExtent,
    createEmpty,
    extend,
    Extent,
    getCenter,
    getHeight,
    getWidth
} from "ol/extent";
import { Coordinate } from "ol/coordinate";
import { Icon, Stroke, Style } from "ol/style";
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
     * The zoom-scale for point results
     */
    zoomScaleForPoints?: number;

    /**
     * The zoom-scale for line or polygon results.
     */
    zoomScaleForLinesOrPolygons?: number;
}

const DEFAULT_SCALE = 5000;
const DEFAULT_BUFFER_FACTOR = 1.2;
const DEFAULT_DPI = 25.4 / 0.28;
const INCHES_PER_METER = 39.37;

/**
 * This function shows the position of a text search result zoomed to and marked or highlighted in the map.
 */
export function resultHandler(options: ResultHandlerOptions) {
    const { olMap, geometries, zoomScaleForPoints, zoomScaleForLinesOrPolygons } = options;
    if (!geometries || !geometries.length) {
        return;
    }

    if (geometries[0]?.getType() === "Point") {
        zoomAndAddMarkers(olMap, geometries, zoomScaleForPoints);
    } else {
        zoomAndHighlight(olMap, geometries, zoomScaleForLinesOrPolygons);
    }
}

function zoomAndAddMarkers(
    olMap: OlMap,
    points: Point[] | LineString[] | Polygon[],
    zoomScale: number | undefined
) {
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
    setCenter(olMap, centerCoords);

    zoomTo(olMap, extent, zoomScale);

    createAndAddLayer(olMap, "Point", points);
}

function zoomAndHighlight(
    olMap: OlMap,
    geometries: Point[] | LineString[] | Polygon[],
    zoomScale: number | undefined
) {
    const type = geometries[0]?.getType() === "Polygon" ? "Polygon" : "Linestring";
    const extent = createEmpty();
    geometries.forEach((geometry) => {
        extend(extent, geometry.getExtent());
    });
    const centerCoords = extent && getCenter(extent);
    setCenter(olMap, centerCoords);

    zoomTo(olMap, extent, zoomScale);

    createAndAddLayer(olMap, type, geometries);
}

function setCenter(olMap: OlMap, coordinates: Coordinate | undefined) {
    coordinates && coordinates.length && olMap.getView().setCenter(coordinates);
}

function zoomTo(olMap: OlMap, extent: Extent | undefined, zoomLevel: number | undefined) {
    if (extent && extent[0] && extent[1] && extent[2] && extent[3]) {
        const width = getHeight(extent);
        const height = getWidth(extent);
        const bufferWidth = width * DEFAULT_BUFFER_FACTOR;
        const bufferHeight = height * DEFAULT_BUFFER_FACTOR;

        const bufferedExtent = [
            extent[0] - (bufferWidth - width) / 2,
            extent[1] - (bufferHeight - height) / 2,
            extent[2] + (bufferWidth - width) / 2,
            extent[3] + (bufferHeight - height) / 2
        ];
        olMap.getView().fit(bufferedExtent, { maxZoom: zoomLevel });
    } else {
        const resolution = getDefaultResolution(olMap);
        resolution && olMap.getView().setResolution(resolution);
    }
}

function getDefaultResolution(olMap: OlMap) {
    const projection = olMap.getView().getProjection();
    let resolution;
    const metersPerUnit = projection.getMetersPerUnit();
    if (metersPerUnit) {
        resolution = DEFAULT_SCALE / (metersPerUnit * INCHES_PER_METER * DEFAULT_DPI);
    }
    return resolution;
}

function createAndAddLayer(
    olMap: OlMap,
    geomType: string,
    geometries: Point[] | LineString[] | Polygon[]
) {
    const features = geometries.map((geometry) => {
        return new Feature({
            type: geomType,
            geometry: geometry
        });
    });
    const layer = new VectorLayer({
        className: "search_result_layer",
        source: new VectorSource({
            features: features
        }),
        style: function (feature) {
            const type: keyof typeof styles = feature.get("type");
            return styles[type];
        }
    });
    removerHighlight(olMap);
    olMap.addLayer(layer);
}

export function removerHighlight(olMap: OlMap) {
    const layer = olMap
        .getLayers()
        .getArray()
        .find((l) => l.getClassName().includes("search_result_layer"));
    layer && olMap.removeLayer(layer);
}

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
