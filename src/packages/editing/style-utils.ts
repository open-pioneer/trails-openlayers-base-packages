// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Style } from "ol/style";
import { MultiPoint, Polygon } from "ol/geom";
import { GeometryFunction } from "ol/style/Style";
import { FlatStyleLike } from "ol/style/flat";
import VectorLayer from "ol/layer/Vector";
import { Feature } from "ol";

// Todo: Add documentation

interface FlatStyleProps {
    polygon: FlatStyleLike;
    vertex: FlatStyleLike;
}

export function getStyle(flatStyle: FlatStyleProps) {
    let polygonStyle = flatStyleToStyle(flatStyle.polygon);
    if (Array.isArray(polygonStyle)) {
        polygonStyle = polygonStyle[0];
    }
    let vertexStyle = flatStyleToStyle(flatStyle.vertex);
    if (Array.isArray(vertexStyle)) {
        vertexStyle = vertexStyle[0];
    }

    const style = [];
    if (polygonStyle) {
        style.push(polygonStyle);
    }
    if (vertexStyle) {
        vertexStyle.setGeometry(constrainGeometryFunction);
        style.push(vertexStyle);
    }

    return style;
}

const constrainGeometryFunction: GeometryFunction = (feature) => {
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

const flatStyleToStyle = (flatStyle: FlatStyleLike): Style[] | Style | undefined => {
    const vectorLayer = new VectorLayer({ style: flatStyle });
    if (!vectorLayer) return;
    const styleFunction = vectorLayer.getStyleFunction();
    if (!styleFunction) return;
    const newFeature = new Feature();
    const fakeResolution = 1;
    const styleResponse = styleFunction(newFeature, fakeResolution);
    if (!styleResponse) return;

    if (Array.isArray(styleResponse)) {
        return styleResponse?.length > 1 ? styleResponse : styleResponse[0];
    } else {
        return styleResponse;
    }
};
