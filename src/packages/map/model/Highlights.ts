// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Feature } from "ol";
import { FeatureLike } from "ol/Feature";
import OlMap from "ol/Map";
import { Coordinate } from "ol/coordinate";
import { Extent, createEmpty, extend, getArea, getCenter } from "ol/extent";
import { Geometry } from "ol/geom";
import { Type } from "ol/geom/Geometry";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Icon, Stroke, Style } from "ol/style";
import { toFunction as toStyleFunction } from "ol/style/Style";
import mapMarkerUrl from "../assets/images/mapMarker.png?url";
import { calculateBufferedExtent } from "../utils/geometry-utils";
import { TOPMOST_LAYER_Z } from "./LayerCollectionImpl";
import {
    DisplayTarget,
    Highlight,
    HighlightOptions,
    HighlightStyle,
    HighlightZoomOptions,
    ZoomOptions
} from "./MapModel";

type HighlightStyleType = keyof HighlightStyle;

const DEFAULT_OL_POINT_ZOOM_LEVEL = 17;
const DEFAULT_OL_MAX_ZOOM_LEVEL = 20;
const DEFAULT_VIEW_PADDING = { top: 50, right: 20, bottom: 10, left: 20 };

export class Highlights {
    private olMap: OlMap;

    private olLayer: VectorLayer<VectorSource, Feature>;
    private olSource: VectorSource<Feature<Geometry>>;
    private activeHighlights: Set<Highlight>;

    constructor(olMap: OlMap) {
        this.olMap = olMap;
        this.olSource = new VectorSource({
            features: undefined
        });
        this.olLayer = new VectorLayer({
            className: "highlight-layer",
            source: this.olSource,
            style: function (feature, resolution) {
                return resolveStyle(feature, resolution);
            }
        });
        this.activeHighlights = new Set();
        this.olLayer.setZIndex(TOPMOST_LAYER_Z);
        this.olMap.addLayer(this.olLayer);
    }

    /**
     * Getter for Hightlightlayer
     * @returns Highlights.olLayer
     */
    getLayer() {
        return this.olLayer;
    }

    /**
     * This method removes all highlights before destroying the class
     */
    destroy() {
        this.clearHighlight();
    }

    /**
     * Method of filtering out objects that are not geometry or have no property geometry.
     */
    #filterGeoobjects(geoObjects: DisplayTarget[]): Geometry[] {
        const geometries: Geometry[] = [];
        geoObjects.forEach((item) => {
            if ("getType" in item) geometries.push(item);
            if ("geometry" in item && item.geometry) geometries.push(item.geometry);
        });
        return geometries;
    }

    /**
     * This method displays geometries or BaseFeatures with optional styling in the map
     */
    addHighlight(displayTarget: DisplayTarget[], highlightOptions: HighlightOptions | undefined) {
        const geometries = this.#filterGeoobjects(displayTarget);

        if (geometries.length === 0) {
            return {
                get isActive() {
                    return false;
                },
                destroy() {}
            };
        }

        const features = geometries.map((geometry) => {
            const type = geometry.getType();
            const feature = new Feature({
                type: type,
                geometry: geometry
            });
            feature.setStyle(getOwnStyle(type, highlightOptions?.highlightStyle));
            return feature;
        });

        const source = this.olSource;
        const highlights = this.activeHighlights;
        const highlight: Highlight = {
            get isActive() {
                return highlights.has(highlight);
            },
            destroy() {
                if (!this.isActive) {
                    return;
                }

                for (const feature of features) {
                    source.removeFeature(feature);
                }
                highlights.delete(highlight);
            }
        };

        source.addFeatures(features);
        this.activeHighlights.add(highlight);
        return highlight;
    }

    /**
     * This method zoom to geometries or BaseFeatures
     */
    zoomToHighlight(displayTarget: DisplayTarget[], options: ZoomOptions | undefined) {
        const geometries = this.#filterGeoobjects(displayTarget);

        if (geometries.length === 0) {
            return;
        }

        let extent = createEmpty();
        for (const geometry of geometries) {
            extent = extend(extent, geometry!.getExtent());
        }

        const bufferParameter = options?.buffer;
        if (typeof bufferParameter === "number") {
            extent = calculateBufferedExtent(extent, bufferParameter);
        }

        const center = getCenter(extent);
        const isPoint = getArea(extent) === 0;
        const zoomScale = isPoint
            ? (options?.pointZoom ?? DEFAULT_OL_POINT_ZOOM_LEVEL)
            : (options?.maxZoom ?? DEFAULT_OL_MAX_ZOOM_LEVEL);
        setCenter(this.olMap, center);

        const {
            top = 0,
            right = 0,
            bottom = 0,
            left = 0
        } = options?.viewPadding ?? DEFAULT_VIEW_PADDING;
        const padding = [top, right, bottom, left];
        zoomTo(this.olMap, extent, zoomScale, padding);
    }

    /**
     * This method displays geometries or BaseFeatures with optional styling in the map and executed a zoom
     */
    addHighlightAndZoom(
        displayTarget: DisplayTarget[],
        highlightZoomStyle: HighlightZoomOptions | undefined
    ) {
        const result = this.addHighlight(displayTarget, highlightZoomStyle);
        this.zoomToHighlight(displayTarget, highlightZoomStyle);
        return result;
    }

    clearHighlight() {
        for (const highlight of this.activeHighlights) {
            highlight.destroy();
        }
    }
}

function setCenter(olMap: OlMap, coordinates: Coordinate | undefined) {
    coordinates && coordinates.length && olMap.getView().setCenter(coordinates);
}

function zoomTo(
    olMap: OlMap,
    extent: Extent | undefined,
    zoomLevel: number | undefined,
    padding: number[]
) {
    if (extent) {
        olMap.getView().fit(extent, { maxZoom: zoomLevel, padding: padding });
    } else {
        zoomLevel && olMap.getView().setZoom(zoomLevel);
    }
}

/**
 * Returns the appropriate style from the user's highlightStyle or falls back to the default style
 */
function resolveStyle(feature: FeatureLike, resolution: number) {
    const type: keyof typeof defaultHighlightStyle = feature.get("type");
    const style = toStyleFunction(getDefaultStyle(type));
    return style(feature, resolution);
}

/**
 * This method creates styling for a highlight based on the optional style information or the default style
 */
function getOwnStyle(type: Type, highlightStyle: HighlightStyle | undefined) {
    if (highlightStyle && type in highlightStyle) {
        const supportedType = type as HighlightStyleType;
        const ownStyle = highlightStyle[supportedType];
        return ownStyle ? ownStyle : getDefaultStyle(type);
    } else {
        return getDefaultStyle(type);
    }
}

/**
 * This returns default styling for a highlight
 */
function getDefaultStyle(type: Type) {
    if (type in defaultHighlightStyle) {
        const supportedType = type as HighlightStyleType;
        return defaultHighlightStyle[supportedType];
    } else {
        return defaultHighlightStyle.Polygon;
    }
}

/**
 * Default styling for highlights
 */
const defaultHighlightStyle = {
    "Point": new Style({
        image: new Icon({
            anchor: [0.5, 1],
            src: mapMarkerUrl
        })
    }),
    "MultiPoint": new Style({
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
    "MultiLineString": [
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
    ],
    "MultiPolygon": [
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
