// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import type { FeatureLike } from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";

// Layer-IDs und interne Titel der Umkreissuche (temporäre Overlays, nicht im TOC, daher nicht i18n).
// Linien und Origin-Marker liegen in zwei getrennten Layern, damit die gestrichelten Linien im
// Kartenstapel unter den Haltestellen-/Bus-/Label-Layern liegen, der Origin-Marker aber ganz oben.
// Beide Layer teilen sich dieselbe VectorSource; die Trennung erfolgt allein über den Feature-`kind`.
export const NEAREST_STOPS_LINES_LAYER_ID = "nearest-stops-lines";
export const NEAREST_STOPS_LINES_LAYER_TITLE = "Nächste Haltestellen – Linien";
export const NEAREST_STOPS_ORIGIN_LAYER_ID = "nearest-stops-origin";
export const NEAREST_STOPS_ORIGIN_LAYER_TITLE = "Nächste Haltestellen – Ausgangspunkt";

const NEAREST_STOPS_FEATURE_KIND_PROPERTY = "nearestStopsKind";

// Kartenmarker-/Linienfarben sind bewusst fachliche Overlay-Datenfarben (analog zum Route-Layer),
// nicht UI-Theme-Tokens. OpenLayers kann CSS-Variablen nicht direkt als Fill/Stroke nutzen.
const NEAREST_STOPS_ACCENT = "rgba(26, 115, 232, 0.95)"; // kräftiges Blau, deutlich sichtbar
const NEAREST_STOPS_LINE = "rgba(26, 115, 232, 0.9)";
const NEAREST_STOPS_HALO = "rgba(255, 255, 255, 0.95)";

/** Parameter für das Zeichnen: Ausgangspunkt und Zielhaltestellen (jeweils Kartenprojektion). */
export type NearestStopsRenderParams = {
    /** Angeklickte Position in Kartenkoordinaten (EPSG:3857). */
    originMapCoord: [number, number];
    /** Zielhaltestellen in Kartenkoordinaten (EPSG:3857). */
    targetMapCoords: [number, number][];
};

/**
 * Erstellt den Linien-Layer der Umkreissuche (nur die gestrichelten Verbindungslinien). Er wird im
 * `MapConfigProvider` unterhalb der Haltestellen-/Bus-/Label-Layer registriert. Nutzt die geteilte
 * Source; Origin-Features werden hier bewusst nicht gezeichnet (Rückgabe `[]`).
 */
export function createNearestStopsLinesLayer(source: VectorSource = new VectorSource()) {
    return new VectorLayer({
        source,
        style: (feature) => getNearestStopsLineStyle(feature),
        properties: { title: NEAREST_STOPS_LINES_LAYER_TITLE }
    });
}

/**
 * Erstellt den Origin-Layer der Umkreissuche (nur der Ausgangspunkt-Marker). Er wird im
 * `MapConfigProvider` als oberster Layer registriert, damit der Marker über den Linien und allen
 * Symbol-/Label-Layern sichtbar bleibt. Nutzt dieselbe geteilte Source wie der Linien-Layer;
 * Link-Features werden hier bewusst nicht gezeichnet (Rückgabe `[]`).
 */
export function createNearestStopsOriginLayer(source: VectorSource = new VectorSource()) {
    return new VectorLayer({
        source,
        style: (feature) => getNearestStopsOriginStyle(feature),
        properties: { title: NEAREST_STOPS_ORIGIN_LAYER_TITLE }
    });
}

/** Fachlicher Stil des Linien-Layers: gestrichelte Verbindungslinie; alles andere wird ausgeblendet. */
export function getNearestStopsLineStyle(feature: FeatureLike) {
    if (feature.get(NEAREST_STOPS_FEATURE_KIND_PROPERTY) !== "link") {
        return [];
    }
    return new Style({
        stroke: new Stroke({ color: NEAREST_STOPS_LINE, width: 2.5, lineDash: [6, 6] })
    });
}

/** Fachlicher Stil des Origin-Layers: deutlich sichtbarer Ausgangspunkt-Marker; sonst ausgeblendet. */
export function getNearestStopsOriginStyle(feature: FeatureLike) {
    if (feature.get(NEAREST_STOPS_FEATURE_KIND_PROPERTY) !== "origin") {
        return [];
    }
    return new Style({
        image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: NEAREST_STOPS_ACCENT }),
            stroke: new Stroke({ color: NEAREST_STOPS_HALO, width: 3 })
        })
    });
}

/**
 * Zeichnet Ausgangspunkt-Marker und gestrichelte Verbindungslinien in die **gemeinsame** Source.
 *
 * Beide Umkreissuche-Layer (Linien und Origin) teilen sich diese eine Source und filtern nur per
 * Feature-`kind`. Dadurch reicht ein einziger Source-Update-/Cleanup-Pfad: Es entstehen keine
 * doppelten Features und keine mehrfachen Layer-Updates.
 *
 * Leert die Source **immer** zuerst, sodass ein neuer Kartenklick die vorherigen Features
 * vollständig ersetzt – auch bei null Treffern (dann bleibt nur der Marker). Ohne Parameter
 * wird die Source ausschließlich geleert (Deaktivierung/Cleanup).
 */
export function renderNearestStops(source: VectorSource, params?: NearestStopsRenderParams) {
    source.clear();
    if (!params) {
        return;
    }

    const { originMapCoord, targetMapCoords } = params;
    for (const target of targetMapCoords) {
        source.addFeature(
            new Feature({
                geometry: new LineString([originMapCoord, target]),
                [NEAREST_STOPS_FEATURE_KIND_PROPERTY]: "link"
            })
        );
    }

    source.addFeature(
        new Feature({
            geometry: new Point(originMapCoord),
            [NEAREST_STOPS_FEATURE_KIND_PROPERTY]: "origin"
        })
    );
}
