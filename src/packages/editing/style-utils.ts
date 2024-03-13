// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Style } from "ol/style";
import { MultiPoint, Polygon } from "ol/geom";
import { GeometryFunction } from "ol/style/Style";
import { FlatStyle } from "ol/style/flat";
import VectorLayer from "ol/layer/Vector";
import { Feature } from "ol";

interface EditingStyleProps {
    polygon: FlatStyle;
    vertex: FlatStyle;
}

/**
 * Function to retrieve an OpenLayers style from OpenLayers FlatStyle.
 *
 * The polygon OpenLayers FlatStyle is convert to an OpenLayers style.
 *
 * The vertex OpenLayers FlatStyle is convert to an OpenLayers style
 * by setting an geometry to the style to render a vertex geometry instead of the feature's geometry.
 */
export function createStyles(editingStyle: EditingStyleProps) {
    let polygonStyle = convertFlatStyleToStyle(editingStyle.polygon);
    if (Array.isArray(polygonStyle)) {
        polygonStyle = polygonStyle[0];
    }

    let vertexStyle = convertFlatStyleToStyle(editingStyle.vertex);
    if (Array.isArray(vertexStyle)) {
        vertexStyle = vertexStyle[0];
    }

    const style = [];
    if (polygonStyle) {
        style.push(polygonStyle);
    }

    // Set a vertex geometry that is rendered instead of the feature's geometry
    if (vertexStyle) {
        vertexStyle.setGeometry(createVertexGeometry);
        style.push(vertexStyle);
    }

    return style;
}

/**
 * Function to create a new multi point geometry from a given feature (to style the point as a vertex).
 * Returns an Openlayers geometry function.
 */
const createVertexGeometry: GeometryFunction = (feature) => {
    if (feature) {
        const geometry = feature.getGeometry() as Polygon;
        if (geometry && geometry.getType() === "Polygon") {
            const coordinates = geometry.getCoordinates()[0];
            if (coordinates) {
                return new MultiPoint(coordinates);
            }
        }
    }
    return undefined;
};

/**
 * Function to convert a OpenLayers FlatStyle to an OpenLayers style by setting the FlatStyle
 * to an OpenLayers feature and retrieve the style from style function.
 */
const convertFlatStyleToStyle = (flatStyle: FlatStyle): Style | Style[] | undefined => {
    const feature = new Feature();
    const vectorLayer = new VectorLayer({ style: flatStyle });

    const styleFunction = vectorLayer.getStyleFunction();
    if (!styleFunction) {
        throw new Error("can't retrieve style function");
    }

    const styles = styleFunction(feature, 1);
    if (!styles) {
        throw new Error("can't retrieve styles from feature style function");
    }

    // Return only first style in array
    if (Array.isArray(styles) && styles.length) {
        return styles.length > 1 ? styles : styles[0];
    } else {
        return styles;
    }
};
