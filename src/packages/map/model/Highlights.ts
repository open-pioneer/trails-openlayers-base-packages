// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource } from "@open-pioneer/core";
import { Feature } from "ol";
import { FeatureLike } from "ol/Feature";
import { Geometry } from "ol/geom";
import { Type } from "ol/geom/Geometry";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Icon, Stroke, Style } from "ol/style";
import { StyleLike, toFunction as toStyleFunction } from "ol/style/Style";
import mapMarkerUrl from "../assets/images/mapMarker.png?url";
import { SimpleLayer } from "../layers/SimpleLayer";
import { LayerDependencies } from "../layers/shared/internals";
import { INTERNAL_CONSTRUCTOR_TAG } from "../utils/InternalConstructorTag";
import { DisplayTarget, MapModel, ZoomOptions } from "./MapModel";
import { getGeometries } from "./getGeometries";

export const DESTROY_HIGHLIGHTS = Symbol("DESTROY_HIGHLIGHTS");
export const GET_HIGHLIGHT_LAYER = Symbol("GET_HIGHLIGHT_LAYER");

/**
 * Style options supported when creating a new {@link Highlight}.
 *
 * @group Map Model
 **/
export interface HighlightOptions {
    /**
     * Optional styles to override the default styles.
     */
    highlightStyle?: HighlightStyle;
}

/**
 * Options supported by the map model's {@link MapModel.highlightAndZoom | highlightAndZoom} method.
 *
 * @group Map Model
 **/
export interface HighlightZoomOptions extends HighlightOptions, ZoomOptions {}

/**
 * Custom styles when creating a new {@link Highlight}.
 *
 * @group Map Model
 */
export type HighlightStyle = {
    Point?: StyleLike;
    LineString?: StyleLike;
    Polygon?: StyleLike;
    MultiPolygon?: StyleLike;
    MultiPoint?: StyleLike;
    MultiLineString?: StyleLike;
};

/**
 * Represents the additional graphical representations of objects.
 *
 * See also {@link MapModel.highlight}.
 *
 * @group Map Model
 */
export interface Highlight extends Resource {
    readonly isActive: boolean;
}

type HighlightStyleType = keyof HighlightStyle;

/**
 * Manages highlights on the map.
 *
 * @group Map Model
 */
export class Highlights {
    private map: MapModel;

    private olLayer: VectorLayer<VectorSource, Feature>;
    private layer: SimpleLayer;
    private olSource: VectorSource<Feature<Geometry>>;
    private activeHighlights: Set<Highlight>;

    constructor(map: MapModel, layerDeps: LayerDependencies) {
        this.map = map;
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
        this.layer = new SimpleLayer(
            {
                title: "highlight-layer",
                internal: true,
                olLayer: this.olLayer
            },
            layerDeps,
            INTERNAL_CONSTRUCTOR_TAG
        );
        map.layers.addLayer(this.layer, { at: "topmost" });

        this.activeHighlights = new Set();
    }

    [DESTROY_HIGHLIGHTS]() {
        this.clear();
    }

    /**
     * Creates a highlight at the given targets.
     *
     * A highlight is a temporary graphic on the map that calls attention to a point or an area.
     *
     * Call `destroy()` on the returned highlight object to remove the highlight.
     */
    add(displayTargets: DisplayTarget[], options?: HighlightOptions | undefined): Highlight {
        const geometries = getGeometries(displayTargets);
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
            feature.setStyle(getOwnStyle(type, options?.highlightStyle));
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
     * Creates a highlight and zooms to the given targets.
     *
     * See also {@link add} and {@link MapModel.zoom}.
     */
    addAndZoom(
        displayTarget: DisplayTarget[],
        options?: HighlightZoomOptions | undefined
    ): Highlight {
        const result = this.add(displayTarget, options);
        this.map.zoom(displayTarget, options);
        return result;
    }

    /**
     * This method destroys all active Highlights.
     */
    clear() {
        for (const highlight of this.activeHighlights) {
            highlight.destroy();
        }
    }

    /**
     * Returns the layer used for highlights.
     */
    [GET_HIGHLIGHT_LAYER]() {
        return this.olLayer;
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
