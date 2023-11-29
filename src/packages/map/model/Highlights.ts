// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Feature } from "ol";
import OlMap from "ol/Map";
import { Coordinate } from "ol/coordinate";
import {
    Extent,
    boundingExtent,
    createEmpty,
    extend,
    getCenter,
    getHeight,
    getWidth
} from "ol/extent";
import { LineString, Point, Polygon } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Icon, Stroke, Style } from "ol/style";
import { toFunction as toStyleFunction } from "ol/style/Style";
import { HighlightOptions, HighlightStyle } from "../api/MapModel";
import mapMarkerUrl from "../assets/images/mapMarker.png?url";
import { FeatureLike } from "ol/Feature";
import { TOPMOST_LAYER_Z } from "./LayerCollectionImpl";
import { Layer as OlLayer } from "ol/layer";

const DEFAULT_OL_ZOOM_LEVEL = 17;
const DEFAULT_MAX_ZOOM_LEVEL = 20;
const DEFAULT_BUFFER_FACTOR = 1.2;

export class Highlights {
    private olMap: OlMap;
    private currentHighlight: OlLayer | undefined;

    constructor(olMap: OlMap) {
        this.olMap = olMap;
    }

    destroy() {
        this.clearHighlight();
    }

    /**
     * This method shows the position of a text search result zoomed to and marked or highlighted in the map.
     */
    addHighlightOrMarkerAndZoom(
        geometries: Point[] | LineString[] | Polygon[],
        options: HighlightOptions
    ) {
        const {
            highlightStyle,
            zoom = DEFAULT_OL_ZOOM_LEVEL,
            maxZoom = DEFAULT_MAX_ZOOM_LEVEL
        } = options;

        // Cleanup existing highlight
        this.clearHighlight();

        if (!geometries || !geometries.length) {
            return;
        }

        if (geometries[0]?.getType() === "Point") {
            this.zoomAndAddMarkers(geometries, highlightStyle, zoom);
        } else {
            this.zoomAndHighlight(geometries, highlightStyle, maxZoom);
        }
    }

    clearHighlight() {
        if (this.currentHighlight) {
            this.olMap.removeLayer(this.currentHighlight);
            this.currentHighlight = undefined;
        }
    }

    private zoomAndAddMarkers(
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
        setCenter(this.olMap, centerCoords);
        zoomTo(this.olMap, extent, zoomScale);
        this.createAndAddLayer("Point", points, highlightStyle);
    }

    private zoomAndHighlight(
        geometries: Point[] | LineString[] | Polygon[],
        highlightStyle: HighlightStyle | undefined,
        zoomScale: number | undefined
    ) {
        const type = geometries[0]?.getType() === "Polygon" ? "Polygon" : "LineString";
        const extent = createEmpty();
        geometries.forEach((geometry) => {
            extend(extent, geometry.getExtent());
        });
        const centerCoords = extent && getCenter(extent);
        setCenter(this.olMap, centerCoords);
        zoomTo(this.olMap, extent, zoomScale);
        this.createAndAddLayer(type, geometries, highlightStyle);
    }

    private createAndAddLayer(
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
        const layer = new VectorLayer({
            className: "highlight-layer",
            source: new VectorSource({
                features: features
            }),
            style: function (feature, resolution) {
                return resolveStyle(feature, resolution, highlightStyle);
            }
        });
        // Ensure layer is rendered on top of operational layers
        layer.setZIndex(TOPMOST_LAYER_Z);
        this.olMap.addLayer(layer);
        this.currentHighlight = layer;
    }
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

/** Returns the appropriate style from the user's highlightStyle or falls back to the default style. */
function resolveStyle(
    feature: FeatureLike,
    resolution: number,
    highlightStyle: HighlightStyle | undefined
) {
    const type: keyof typeof defaultHighlightStyle = feature.get("type");
    const style = toStyleFunction(highlightStyle?.[type] ?? defaultHighlightStyle[type]);
    return style(feature, resolution);
}

const defaultHighlightStyle = {
    "Point": new Style({
        image: new Icon({
            anchor: [0.5, 1],
            src: mapMarkerUrl
        })
    }),
    "LineString": [
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
