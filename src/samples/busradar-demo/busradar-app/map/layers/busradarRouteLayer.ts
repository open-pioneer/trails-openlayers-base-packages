// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import Feature, { type FeatureLike } from "ol/Feature";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, RegularShape, Stroke, Style } from "ol/style";
import {
    BUSRADAR_ROUTE_DIRECTION_STYLE_Z_INDEX,
    BUSRADAR_ROUTE_STYLE_Z_INDEX,
    type BusradarRouteSplit
} from "./busradarLayer";

// Layer-ID und interner Titel der ausgewählten Busfahrt (Metadaten, nicht im TOC sichtbar, daher
// bewusst nicht i18n).
export const BUSRADAR_ROUTE_LAYER_ID = "busradar-selected-route";
export const BUSRADAR_ROUTE_LAYER_TITLE = "Ausgewählte Busfahrt";

/**
 * Erstellt den OpenLayers-Vektorlayer für die ausgewählte Busfahrt (Route inkl.
 * Richtungspfeile). Die Stapelreihenfolge ergibt sich aus der Registrierungsreihenfolge
 * im Trails-`MapConfigProvider`; die Feature-Befüllung bleibt Aufgabe des Aufrufers.
 */
export function createBusradarRouteLayer(source: VectorSource = new VectorSource()) {
    return new VectorLayer({
        source,
        style: (feature) => getBusradarRouteStyle(feature),
        properties: { title: BUSRADAR_ROUTE_LAYER_TITLE }
    });
}

/** Fachlicher Stil der Route: gefahrener Teil, kommender Teil und Richtungspfeile. */
export function getBusradarRouteStyle(feature: FeatureLike) {
    const routePart = feature.get("routePart");
    if (routePart === "passed") {
        return new Style({
            zIndex: BUSRADAR_ROUTE_STYLE_Z_INDEX,
            stroke: new Stroke({ color: "rgba(45, 55, 70, 0.35)", width: 4 })
        });
    }
    if (routePart === "direction") {
        return new Style({
            zIndex: BUSRADAR_ROUTE_DIRECTION_STYLE_Z_INDEX,
            image: new RegularShape({
                points: 3,
                radius: 7,
                rotation: Number(feature.get("rotation") ?? 0),
                fill: new Fill({ color: "rgba(26, 115, 232, 0.85)" }),
                stroke: new Stroke({ color: "rgba(255, 255, 255, 0.95)", width: 1 })
            })
        });
    }
    return new Style({
        zIndex: BUSRADAR_ROUTE_STYLE_Z_INDEX,
        stroke: new Stroke({ color: "rgba(26, 115, 232, 0.9)", width: 5 })
    });
}

/**
 * Zeichnet die ausgewählte Busfahrt in die Route-Source. Leert die Source und fügt je nach
 * verfügbarem Split den gefahrenen Teil, den kommenden Teil (inkl. Richtungspfeilen) oder – als
 * Fallback ohne Split – die gesamte Route ein. Ohne `routeSplit` bleibt die Source leer.
 */
export function renderBusradarRoute(
    source: VectorSource,
    routeSplit: BusradarRouteSplit | undefined
) {
    source.clear();
    if (!routeSplit) {
        return;
    }

    if (routeSplit.passedCoordinates.length >= 2) {
        source.addFeature(
            new Feature({
                geometry: new LineString(routeSplit.passedCoordinates),
                routePart: "passed"
            })
        );
    }

    if (routeSplit.upcomingCoordinates.length >= 2) {
        source.addFeature(
            new Feature({
                geometry: new LineString(routeSplit.upcomingCoordinates),
                routePart: "upcoming"
            })
        );
        addRouteDirectionFeatures(source, routeSplit.upcomingCoordinates);
    } else if (routeSplit.route.mapCoordinates.length >= 2) {
        source.addFeature(
            new Feature({
                geometry: new LineString(routeSplit.route.mapCoordinates),
                routePart: "full"
            })
        );
    }
}

/** Verteilt Richtungspfeil-Features gleichmäßig entlang der kommenden Route. */
export function addRouteDirectionFeatures(source: VectorSource, coordinates: [number, number][]) {
    if (coordinates.length < 4) {
        return;
    }

    const step = Math.max(4, Math.floor(coordinates.length / 4));
    for (let index = step; index < coordinates.length - 1; index += step) {
        const previous = coordinates[index - 1];
        const coordinate = coordinates[index];
        const next = coordinates[index + 1];
        if (!previous || !coordinate || !next) {
            continue;
        }

        source.addFeature(
            new Feature({
                geometry: new Point(coordinate),
                routePart: "direction",
                rotation: Math.atan2(next[1] - previous[1], next[0] - previous[0]) + Math.PI / 2
            })
        );
    }
}
