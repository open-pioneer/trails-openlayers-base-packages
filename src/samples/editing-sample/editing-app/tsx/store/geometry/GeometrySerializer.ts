// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { GeoJSON } from "ol/format";
import { Circle, type Geometry } from "ol/geom";
import { Projection, transformExtent } from "ol/proj";
import type { Extent } from "ol/extent";
import type { Type as GeometryType } from "ol/geom/Geometry";
import type { Envelope } from "./Envelope";

export class GeometrySerializer {
    constructor(wkid: number) {
        this.dataProjection = new Projection({ code: `EPSG:${wkid}` });
        this.geoJSON = new GeoJSON({ dataProjection: this.dataProjection });
    }

    toGeometry(geometryString: string | undefined, target: Projection): Geometry | undefined {
        if (geometryString != null) {
            try {
                return this.geoJSON.readGeometry(geometryString, { featureProjection: target });
            } catch (error) {
                const circle = this.deserializeCircle(geometryString, target);
                if (circle != null) {
                    return circle;
                } else {
                    throw error;
                }
            }
        } else {
            return undefined;
        }
    }

    toGeometryString(geometry: Geometry | undefined, source: Projection): string | undefined {
        if (GeometrySerializer.isCircle(geometry)) {
            return this.serializeCircle(geometry, source);
        } else if (geometry != null) {
            return this.geoJSON.writeGeometry(geometry, { featureProjection: source });
        } else {
            return undefined;
        }
    }

    getTransformedEnvelope(
        geometry: Geometry | undefined,
        source: Projection
    ): Envelope | undefined {
        const extent = geometry?.getExtent();
        if (extent != null) {
            return this.toTransformedEnvelope(extent, source);
        } else {
            return undefined;
        }
    }

    toTransformedEnvelope(extent: Extent, source: Projection): Envelope {
        const transformedExtent = transformExtent(extent, source, this.dataProjection);
        return GeometrySerializer.toEnvelope(transformedExtent);
    }

    private serializeCircle(circle: Circle, projection: Projection): string {
        const transformedCircle = circle.clone().transform(projection, this.dataProjection);
        return JSON.stringify({
            type: GeometrySerializer.CIRCLE,
            center: transformedCircle.getCenter(),
            radius: transformedCircle.getRadius()
        });
    }

    private deserializeCircle(circleString: string, projection: Projection): Circle | undefined {
        try {
            const { type, center, radius } = JSON.parse(circleString);
            if (type === GeometrySerializer.CIRCLE) {
                const circle = new Circle(center, radius);
                return circle.transform(this.dataProjection, projection);
            } else {
                return undefined;
            }
        } catch {
            return undefined;
        }
    }

    private static toEnvelope(extent: Extent): Envelope {
        return {
            minX: extent[0]!,
            minY: extent[1]!,
            maxX: extent[2]!,
            maxY: extent[3]!
        };
    }
    
    private static isCircle(geometry: Geometry | undefined): geometry is Circle {
        return geometry?.getType() === GeometrySerializer.CIRCLE;
    }

    private readonly geoJSON: GeoJSON;
    private readonly dataProjection: Projection;

    private static readonly CIRCLE: GeometryType = "Circle";
}
