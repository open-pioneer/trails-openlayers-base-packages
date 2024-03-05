// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Feature } from "ol";
import OlMap from "ol/Map";
import { Coordinate } from "ol/coordinate";
import { Extent, createEmpty, extend, getArea, getCenter } from "ol/extent";
import { Geometry, LineString, Point, Polygon } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Icon, Stroke, Style } from "ol/style";
import { toFunction as toStyleFunction } from "ol/style/Style";
import { Highlight, HighlightOptions, HighlightStyle } from "../api/MapModel";
import mapMarkerUrl from "../assets/images/mapMarker.png?url";
import { FeatureLike } from "ol/Feature";
import { Layer as OlLayer } from "ol/layer";

const DEFAULT_OL_POINT_ZOOM_LEVEL = 17;
const DEFAULT_OL_MAX_ZOOM_LEVEL = 20;
const DEFAULT_VIEW_PADDING = { top: 50, right: 20, bottom: 10, left: 20 };

export class Highlights {
    private olMap: OlMap;
    private currentHighlight: OlLayer | undefined;

    // TODO: Create layer / source
    private olLayer!: VectorLayer<VectorSource>;
    private olSource!: VectorSource<Feature<Geometry>>;
    private activeHighlights!: Set<Highlight>;

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
        // Cleanup existing highlight
        this.clearHighlight();

        if (!geometries || !geometries.length) {
            return;
        }
        this.zoomAndAddMarkers(geometries, options);
    }

    // TODO this is "clear"
    clearHighlight() {
        for (const highlight of this.activeHighlights) {
            highlight.destroy();
        }

        // if (this.currentHighlight) {
        //     this.olMap.removeLayer(this.currentHighlight);
        //     this.currentHighlight = undefined;
        // }
    }

    private zoomAndAddMarkers(geometries: Geometry[], options: HighlightOptions | undefined) {
        let extent = createEmpty();
        for (const geom of geometries) {
            extent = extend(extent, geom.getExtent());
        }

        const center = getCenter(extent);
        const isPoint = getArea(extent) === 0;
        const zoomScale = isPoint
            ? options?.pointZoom ?? DEFAULT_OL_POINT_ZOOM_LEVEL
            : options?.maxZoom ?? DEFAULT_OL_MAX_ZOOM_LEVEL;
        setCenter(this.olMap, center);

        const {
            top = 0,
            right = 0,
            bottom = 0,
            left = 0
        } = options?.viewPadding ?? DEFAULT_VIEW_PADDING;
        const padding = [top, right, bottom, left];
        zoomTo(this.olMap, extent, zoomScale, padding);

        this.createAndAddLayer(geometries, options?.highlightStyle);
    }

    private createAndAddLayer(geometries: Geometry[], highlightStyle: HighlightStyle | undefined): Highlight {
        const features = geometries.map((geometry) => {
            return new Feature({
                type: geometry.getType(),
                geometry: geometry,
                // TODO: Style for THIS highlight
            });
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
        return highlight;

        // const layer = new VectorLayer({
        //     className: "highlight-layer",
        //     source: new VectorSource({
        //         features: features
        //     }),
        //     style: function (feature, resolution) {
        //         return resolveStyle(feature, resolution, highlightStyle);
        //     }
        // });
        // // Ensure layer is rendered on top of operational layers
        // layer.setZIndex(TOPMOST_LAYER_Z);
        // this.olMap.addLayer(layer);
        // this.currentHighlight = layer;
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
