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
import { Fill, Icon, Stroke, Style } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import mapMarkerUrl from "./images/mapMarker.png?url";

interface HighlightStyle {
    Point: Style;
    Linestring: Style | Style[];
    Polygon: Style | Style[];
}
export interface ResultHandlerOptions {
    /**
     * The style for highlight and marker
     * */
    highlightStyle?: HighlightStyle;

    /**
     * The zoom-level for point results
     */
    zoom?: number;

    /**
     * The maximum zoom-level for line or polygon results.
     */
    maxZoom?: number;
}

const DEFAULT_OL_ZOOM_LEVEL = 17;
const DEFAULT_MAX_ZOOM_LEVEL = 20;
const DEFAULT_BUFFER_FACTOR = 1.2;

/**
 * This function shows the position of a text search result zoomed to and marked or highlighted in the map.
 */
export function resultHandler(
    olMap: OlMap,
    geometries: Point[] | LineString[] | Polygon[],
    options: ResultHandlerOptions
) {
    const {
        highlightStyle,
        zoom = DEFAULT_OL_ZOOM_LEVEL,
        maxZoom = DEFAULT_MAX_ZOOM_LEVEL
    } = options;

    if (!geometries || !geometries.length) {
        return;
    }

    if (geometries[0]?.getType() === "Point") {
        zoomAndAddMarkers(olMap, geometries, highlightStyle, zoom);
    } else {
        zoomAndHighlight(olMap, geometries, highlightStyle, maxZoom);
    }
}

function zoomAndAddMarkers(
    olMap: OlMap,
    points: Point[] | LineString[] | Polygon[],
    highlightStyle: HighlightStyle | undefined,
    zoomScale: number | undefined
) {
    let centerCoords;
    let extent: Extent | undefined;
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

    createAndAddLayer(olMap, "Point", points, highlightStyle);
}

function zoomAndHighlight(
    olMap: OlMap,
    geometries: Point[] | LineString[] | Polygon[],
    highlightStyle: HighlightStyle | undefined,
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

    createAndAddLayer(olMap, type, geometries, highlightStyle);
}

function setCenter(olMap: OlMap, coordinates: Coordinate | undefined) {
    coordinates && coordinates.length && olMap.getView().setCenter(coordinates);
}

function zoomTo(olMap: OlMap, extent: Extent | undefined, zoomLevel: number | undefined) {
    if (extent) {
        const bufferedExtent: Extent | undefined = calculateBufferedExtent(extent);
        bufferedExtent && olMap.getView().fit(bufferedExtent, { maxZoom: zoomLevel });
    } else {
        zoomLevel && olMap.getView().setZoom(zoomLevel);
    }
}

export function calculateBufferedExtent(extent: Extent) {
    let bufferedExtent;
    if (extent[0] && extent[1] && extent[2] && extent[3]) {
        const width = getHeight(extent);
        const height = getWidth(extent);
        const bufferWidth = width * DEFAULT_BUFFER_FACTOR;
        const bufferHeight = height * DEFAULT_BUFFER_FACTOR;

        bufferedExtent = [
            extent[0] - (bufferWidth - width) / 2,
            extent[1] - (bufferHeight - height) / 2,
            extent[2] + (bufferWidth - width) / 2,
            extent[3] + (bufferHeight - height) / 2
        ];
    }
    return bufferedExtent;
}

function createAndAddLayer(
    olMap: OlMap,
    geomType: string,
    geometries: Point[] | LineString[] | Polygon[],
    highlightStyle: HighlightStyle | undefined
) {
    const features = geometries.map((geometry) => {
        return new Feature({
            type: geomType,
            geometry: geometry
        });
    });
    const styles = highlightStyle || defaultHighlightStyle;
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

const defaultHighlightStyle = {
    "Point": new Style({
        image: new Icon({
            anchor: [0.5, 1],
            src: mapMarkerUrl
        })
    }),
    "Linestring": [
        new Style({
            stroke: new Stroke({
                color: "#fff",
                width: 5
            })
        }),
        new Style({
            stroke: new Stroke({
                color: "#00ffff",
                width: 3
            })
        })
    ],
    "Polygon": [
        new Style({
            stroke: new Stroke({
                color: "#fff",
                width: 5
            })
        }),
        new Style({
            stroke: new Stroke({
                color: "#00ffff",
                width: 3
            }),
            fill: new Fill({
                color: "rgba(224,255,255,0.35)"
            })
        })
    ]
};
