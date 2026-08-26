// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { Fill, Icon, Stroke, Style, Text } from "ol/style";
import { loadTransitStops, type TransitStop } from "../../api/transitStops";

export const TRANSIT_STOPS_LAYER_ID = "haltestellen-muenster";
export const TRANSIT_STOPS_LAYER_TITLE = "Haltestellen Münster";
// Eigener Layer nur für die ausgewählte Haltestelle. Seine Stapelposition (über dem
// Busradar-Fahrzeug-Layer, damit der rote Marker über Bus-Markern und Bus-Labels sichtbar
// bleibt) ergibt sich aus der Registrierungsreihenfolge im Trails-`MapConfigProvider`.
export const SELECTED_TRANSIT_STOPS_LAYER_ID = "haltestellen-muenster-auswahl";
export const SELECTED_TRANSIT_STOPS_LAYER_TITLE = "Ausgewählte Haltestelle";

// Basis-z-Index der Feature-Styles innerhalb des Haltestellen-Layers. Ordnet nur die Features
// dieses Layers untereinander (ausgewählt/nächste/Route/normal); die Layer-Stapelreihenfolge
// verwaltet Trails über die Collection-Order.
const TRANSIT_STOP_STYLE_BASE_Z_INDEX = 25;

// Kleinere Resolution-Werte bedeuten näheren Zoom; diese Schwellen steuern Marker und Labels.
const TRANSIT_STOP_MARKER_MAX_RESOLUTION = 3;
const TRANSIT_STOP_LABEL_MAX_RESOLUTION = 0.5;
// Zoomabhängige Skalierung des ausgewählten Markers: Er bleibt beim Herauszoomen
// immer sichtbar (kein Ausblenden durch die Resolution-Schwelle) und wächst leicht mit,
// damit er klar erkennbar bleibt, ohne beim Hineinzoomen unverhältnismäßig groß zu werden.
const TRANSIT_STOP_SELECTED_MIN_SCALE = 1.4; // hineingezoomt: entspricht der bisherigen Größe
const TRANSIT_STOP_SELECTED_MAX_SCALE = 2.0; // weit herausgezoomt: deutlich sichtbar
const TRANSIT_STOP_SELECTED_SCALE_STEP = 0.16; // Zuwachs pro Zoom-Stufe beim Herauszoomen
const TRANSIT_STOP_ROUTE_STATE_PROPERTY = "transitStopRouteState";
const TRANSIT_STOP_ROUTE_HIGHLIGHT_STOP_IDS_PROPERTY = "transitStopRouteHighlightStopIds";
const TRANSIT_STOP_ROUTE_HIGHLIGHT_NEXT_STOP_ID_PROPERTY = "transitStopRouteHighlightNextStopId";
const TRANSIT_STOP_SELECTED_STOP_ID_PROPERTY = "transitStopSelectedStopId";
const TRANSIT_STOP_SELECTED_PROPERTY = "transitStopSelected";
// Referenz auf die Source des Selected-Stop-Layers, hinterlegt auf der Haupt-Source. So kann
// der Daten-Refresh (applyTransitStops) den ausgewählten Klon mit-synchronisieren, obwohl der
// Controller nur die Haupt-Source kennt (F-06).
const TRANSIT_STOP_SELECTED_SOURCE_PROPERTY = "transitStopSelectedSource";

// Stroke-Breite der Marker-Umrandung je Zustand (Auswahl/nächste/Route/normal).
const TRANSIT_STOP_STROKE_WIDTH_SELECTED = 3;
const TRANSIT_STOP_STROKE_WIDTH_NEXT = 3;
const TRANSIT_STOP_STROKE_WIDTH_ROUTE = 2.7;
const TRANSIT_STOP_STROKE_WIDTH_NORMAL = 2.2;

// Zusätzliche Marker-Skalierung je Zustand. Die Auswahl wird separat zoomabhängig berechnet.
const TRANSIT_STOP_SCALE_NEXT = 1.36;
const TRANSIT_STOP_SCALE_ROUTE = 1.18;
const TRANSIT_STOP_SCALE_DIMMED = 0.88;
const TRANSIT_STOP_SCALE_NORMAL = 1;

// Vertikaler Label-Versatz nach oben je Marker-Größe.
const TRANSIT_STOP_LABEL_OFFSET_Y_LARGE = -58; // Auswahl und nächste Haltestelle
const TRANSIT_STOP_LABEL_OFFSET_Y_ROUTE = -50;
const TRANSIT_STOP_LABEL_OFFSET_Y_NORMAL = -40;

// z-Index-Zuschläge relativ zum Layer-z-Index, damit wichtigere Marker oben liegen.
const TRANSIT_STOP_Z_OFFSET_SELECTED = 7;
const TRANSIT_STOP_Z_OFFSET_NEXT = 5;
const TRANSIT_STOP_Z_OFFSET_ROUTE = 3;
const TRANSIT_STOP_Z_OFFSET_NORMAL = 0;
const TRANSIT_STOP_LABEL_Z_OFFSET = 1; // Label liegt knapp über dem zugehörigen Icon.

// Deckkraft des Icons und Label-Alpha für ausgeblendete (dimmed) Marker.
const TRANSIT_STOP_DIMMED_ICON_OPACITY = 0.4;
const TRANSIT_STOP_DIMMED_LABEL_ALPHA = 0.4;

// Label-Typografie und weißer Halo-Stroke für Kontrast auf beiden Basemaps.
const TRANSIT_STOP_LABEL_FONT = "650 12.5px system-ui, sans-serif";
const TRANSIT_STOP_LABEL_HALO_WIDTH = 5;

const transitStopIconCache = new Map<string, string>();

type TransitStopRouteState = "normal" | "dimmed" | "route" | "next";

/**
 * Zentrale Farbkonfiguration der Haltestellenmarker.
 *
 * Die Werte sind bewusst keine im Code fest verdrahteten Designfarben, sondern werden
 * zur Laufzeit aus den aufgelösten Trails-/Chakra-Theme-Tokens gesetzt
 * (siehe `applyTransitStopThemeColors`). OpenLayers kann CSS-Ausdrücke wie
 * `var(--chakra-colors-trails-fg)` nicht direkt als Fill/Stroke verwenden, deshalb
 * übergibt die App die bereits per `getComputedStyle(...)` aufgelösten Farbwerte.
 *
 * Die folgenden Konstanten sind ausschließlich technische Fallbacks für den Fall,
 * dass ein Theme-Token zur Laufzeit nicht auflösbar ist. Sie orientieren sich an den
 * erwarteten Trails-Light-Werten, ersetzen aber nie still einen fehlenden Token ohne
 * Warnung (die Warnung erfolgt in der App beim Auslesen der Tokens).
 */
const TRANSIT_STOP_FALLBACK_NORMAL = "#1b4b5f"; // ~ trails.fg (trails.700, light)
const TRANSIT_STOP_FALLBACK_SELECTED = "#c1121f"; // ~ red.solid (light)
const TRANSIT_STOP_FALLBACK_NEXT = "#f97316"; // orange next-stop (Busradar-Route)
const TRANSIT_STOP_FALLBACK_LABEL = "#0f172a"; // dunkler Label-Text
const TRANSIT_STOP_HALO = "#ffffff"; // weißer Stroke/Kontrast auf beiden Basemaps

export interface TransitStopThemeColors {
    /** Normale und Route-Haltestellen (Trails-Vordergrundfarbe). */
    normal: string;
    /** Aktuell ausgewählte Haltestelle (rote Statusfarbe). */
    selected: string;
    /** Nächste Haltestelle einer aktiven Busradar-Route. */
    next: string;
    /** Label-Textfarbe. */
    label: string;
    /** Stroke-/Halo-Farbe für Kontrast. */
    halo: string;
}

const transitStopColors: TransitStopThemeColors = {
    normal: TRANSIT_STOP_FALLBACK_NORMAL,
    selected: TRANSIT_STOP_FALLBACK_SELECTED,
    next: TRANSIT_STOP_FALLBACK_NEXT,
    label: TRANSIT_STOP_FALLBACK_LABEL,
    halo: TRANSIT_STOP_HALO
};

/**
 * Aktualisiert die zentrale Farbkonfiguration der Haltestellenmarker mit aufgelösten
 * Theme-Farbwerten und stößt ein Neuzeichnen des Layers an.
 *
 * Erwartet konkrete CSS-Farbwerte (z. B. `#1b4b5f`), keine `var(...)`-Ausdrücke.
 */
export function applyTransitStopThemeColors(
    layer: VectorLayer<VectorSource>,
    colors: Partial<TransitStopThemeColors>
) {
    Object.assign(transitStopColors, colors);
    // Cache leeren, da die Icon-Data-URIs die alten Farben enthalten.
    transitStopIconCache.clear();
    layer.changed();
}

/**
 * Setzt oder entfernt die aktuell ausgewählte Haltestelle. Der Haupt-Layer blendet die
 * ausgewählte Haltestelle aus; der Selected-Stop-Layer rendert stattdessen den roten
 * Marker über den Bus-Markern/Labels. Bei Auswahlwechsel wird der Klon aktualisiert.
 */
export function setSelectedTransitStop(
    mainLayer: VectorLayer<VectorSource>,
    selectedLayer: VectorLayer<VectorSource>,
    stopId?: string
) {
    const source = mainLayer.getSource();
    const selectedSource = selectedLayer.getSource();
    if (!source || !selectedSource) {
        return;
    }

    // Referenz hinterlegen, damit ein späterer Daten-Refresh den Klon mit-synchronisieren kann.
    source.set(TRANSIT_STOP_SELECTED_SOURCE_PROPERTY, selectedSource, true);

    if (stopId) {
        source.set(TRANSIT_STOP_SELECTED_STOP_ID_PROPERTY, stopId, true);
    } else {
        source.unset(TRANSIT_STOP_SELECTED_STOP_ID_PROPERTY, true);
    }

    applySelectedTransitStopToSource(source, stopId);
    syncSelectedTransitStopLayer(source, selectedSource, stopId);
    mainLayer.changed();
    selectedLayer.changed();
}

/**
 * Stellt sicher, dass die Haltestelle als Feature in der Haupt-Source existiert. Der Haupt-Layer
 * lädt seine Daten nur bei Sichtbarkeit; wurde er nie aktiviert, ist die Source leer und ein
 * anschließendes {@link setSelectedTransitStop} könnte den roten Marker nicht rendern. Da der
 * Stop real aus `loadTransitStops` stammt, bleibt ein hier injiziertes Feature bei einem späteren
 * Daten-Refresh (`applyTransitStops`) erhalten und erzeugt keinen Orphan.
 */
export function ensureTransitStopFeature(
    mainLayer: VectorLayer<VectorSource>,
    stop: TransitStop
): void {
    const source = mainLayer.getSource();
    if (!source || findTransitStopFeature(source, stop.stopId)) {
        return;
    }
    source.addFeature(createTransitStopFeature(stop));
}

/**
 * Hält die Source des Selected-Stop-Layers synchron: leert sie und legt bei aktiver
 * Auswahl einen Klon des ausgewählten Features hinein (inkl. `selected`-Flag), damit
 * der geteilte Style den roten Marker rendert.
 */
function syncSelectedTransitStopLayer(
    source: VectorSource,
    selectedSource: VectorSource,
    stopId?: string
) {
    selectedSource.clear();
    if (!stopId) {
        return;
    }

    const feature = findTransitStopFeature(source, stopId);
    if (!feature || !(feature instanceof Feature)) {
        return;
    }

    const clone = feature.clone();
    clone.setId(feature.getId());
    clone.set(TRANSIT_STOP_SELECTED_PROPERTY, true, true);
    selectedSource.addFeature(clone);
}

function findTransitStopFeature(source: VectorSource, stopId: string): Feature | null {
    const byId = source.getFeatureById(stopId);
    if (byId) {
        return byId as Feature;
    }
    for (const feature of source.getFeatures()) {
        const id = String(feature.get("stopId") ?? feature.getId() ?? "");
        if (id === stopId) {
            return feature;
        }
    }
    return null;
}

/** Liefert die aktuell im Haupt-Layer ausgewählte Haltestellen-ID, falls vorhanden. */
export function getSelectedTransitStopId(layer: VectorLayer<VectorSource>): string | undefined {
    return layer.getSource()?.get(TRANSIT_STOP_SELECTED_STOP_ID_PROPERTY) as string | undefined;
}

/**
 * Markiert die ausgewählte Haltestelle pro Feature, damit die Style-Funktion sie
 * ohne Zugriff auf die Source erkennen kann.
 */
function applySelectedTransitStopToSource(source: VectorSource, stopId?: string) {
    for (const feature of source.getFeatures()) {
        const id = String(feature.get("stopId") ?? feature.getId() ?? "");
        const isSelected = !!stopId && id === stopId;
        if (isSelected) {
            feature.set(TRANSIT_STOP_SELECTED_PROPERTY, true, true);
        } else if (feature.get(TRANSIT_STOP_SELECTED_PROPERTY)) {
            feature.unset(TRANSIT_STOP_SELECTED_PROPERTY, true);
        }
        feature.changed();
    }

    source.changed();
}

export function createTransitStopsLayer() {
    const source = new VectorSource();
    const controller = createTransitStopsController(source);
    const layer = new VectorLayer({
        source,
        visible: false,
        // Die ausgewählte Haltestelle wird im separaten Selected-Stop-Layer gerendert und
        // hier ausgeblendet, damit kein Doppelmarker entsteht.
        style: (feature, resolution) =>
            getIsSelectedTransitStop(feature) ? [] : createTransitStopStyle(feature, resolution),
        properties: {
            title: TRANSIT_STOPS_LAYER_TITLE
        }
    });
    layer.set("id", TRANSIT_STOPS_LAYER_ID);

    layer.on("change:visible", () => {
        if (layer.getVisible()) {
            controller.start();
        } else {
            controller.stop();
        }
    });

    return layer;
}

/**
 * Separater Layer, der ausschließlich die aktuell ausgewählte Haltestelle rendert.
 * Er liegt über dem Busradar-Fahrzeug-Layer, sodass der rote Marker nicht von
 * Bus-Markern oder Bus-Labels verdeckt wird.
 */
export function createSelectedTransitStopsLayer() {
    const source = new VectorSource();
    const layer = new VectorLayer({
        source,
        visible: true,
        style: (feature, resolution) => createTransitStopStyle(feature, resolution),
        properties: {
            title: SELECTED_TRANSIT_STOPS_LAYER_TITLE
        }
    });
    layer.set("id", SELECTED_TRANSIT_STOPS_LAYER_ID);
    return layer;
}

export function applyTransitStopRouteHighlight(
    layer: VectorLayer<VectorSource>,
    stopIds: string[],
    nextStopId?: string
) {
    if (stopIds.length === 0) {
        clearTransitStopRouteHighlight(layer);
        return;
    }

    const source = layer.getSource();
    if (!source) {
        return;
    }

    source.set(TRANSIT_STOP_ROUTE_HIGHLIGHT_STOP_IDS_PROPERTY, stopIds, true);
    source.set(TRANSIT_STOP_ROUTE_HIGHLIGHT_NEXT_STOP_ID_PROPERTY, nextStopId, true);
    applyTransitStopRouteHighlightToSource(source, stopIds, nextStopId);
    layer.changed();
}

export function clearTransitStopRouteHighlight(layer: VectorLayer<VectorSource>) {
    const source = layer.getSource();
    if (!source) {
        return;
    }

    source.unset(TRANSIT_STOP_ROUTE_HIGHLIGHT_STOP_IDS_PROPERTY, true);
    source.unset(TRANSIT_STOP_ROUTE_HIGHLIGHT_NEXT_STOP_ID_PROPERTY, true);

    for (const feature of source.getFeatures()) {
        feature.unset(TRANSIT_STOP_ROUTE_STATE_PROPERTY, true);
        feature.changed();
    }

    source.changed();
    layer.changed();
}

function applyTransitStopRouteHighlightToSource(
    source: VectorSource,
    stopIds: string[],
    nextStopId?: string
) {
    const highlightedStopIds = new Set(stopIds);
    for (const feature of source.getFeatures()) {
        const stopId = String(feature.get("stopId") ?? feature.getId() ?? "");
        const state: TransitStopRouteState =
            nextStopId && stopId === nextStopId
                ? "next"
                : highlightedStopIds.has(stopId)
                  ? "route"
                  : "dimmed";
        feature.set(TRANSIT_STOP_ROUTE_STATE_PROPERTY, state, true);
        feature.changed();
    }

    source.changed();
}

function createTransitStopsController(source: VectorSource) {
    let isActive = false;
    let abortController: AbortController | undefined;

    function start() {
        if (isActive) {
            return;
        }

        isActive = true;
        void refresh();
    }

    function stop() {
        isActive = false;
        abortController?.abort();
        abortController = undefined;
    }

    async function refresh() {
        abortController?.abort();
        abortController = new AbortController();

        try {
            const stops = await loadTransitStops(abortController.signal);
            if (isActive) {
                applyTransitStops(stops, source);
            }
        } catch (error) {
            if ((error as Error).name !== "AbortError") {
                console.error("Haltestellen konnten nicht geladen werden.", error);
            }
        }
    }

    return { start, stop };
}

function createTransitStopFeature(stop: TransitStop): Feature<Point> {
    const feature = new Feature<Point>({
        geometry: new Point(fromLonLat(stop.lonLat) as [number, number]),
        ...stop
    });
    feature.setId(stop.stopId);
    return feature;
}

function applyTransitStops(stops: TransitStop[], source: VectorSource) {
    const activeIds = new Set<string>();

    for (const stop of stops) {
        activeIds.add(stop.stopId);
        const existingFeature = source.getFeatureById(stop.stopId) as Feature<Point> | null;
        const mapCoordinate = fromLonLat(stop.lonLat) as [number, number];

        if (existingFeature) {
            existingFeature.setProperties(stop);
            existingFeature.getGeometry()?.setCoordinates(mapCoordinate);
        } else {
            source.addFeature(createTransitStopFeature(stop));
        }
    }

    source.changed();

    const highlightedStopIds = source.get(TRANSIT_STOP_ROUTE_HIGHLIGHT_STOP_IDS_PROPERTY) as
        | string[]
        | undefined;
    if (highlightedStopIds) {
        applyTransitStopRouteHighlightToSource(
            source,
            highlightedStopIds,
            source.get(TRANSIT_STOP_ROUTE_HIGHLIGHT_NEXT_STOP_ID_PROPERTY) as string | undefined
        );
    }

    // Auswahl nach einem Daten-Refresh erneut anwenden, damit neu geladene Features
    // die ausgewählte Haltestelle wieder rot darstellen.
    const selectedStopId = source.get(TRANSIT_STOP_SELECTED_STOP_ID_PROPERTY) as string | undefined;
    if (selectedStopId) {
        applySelectedTransitStopToSource(source, selectedStopId);
    }

    for (const feature of source.getFeatures()) {
        const id = String(feature.getId() ?? "");
        if (id && !activeIds.has(id)) {
            source.removeFeature(feature);
        }
    }

    // Den Selected-Stop-Klon mit den aktualisierten Daten synchronisieren, damit im
    // Selected-Layer kein veralteter roter Marker („Ghost") stehen bleibt (F-06). Läuft nach
    // dem Entfernen veralteter Features, sodass eine verschwundene Auswahl den Klon leert.
    if (selectedStopId) {
        const selectedSource = source.get(TRANSIT_STOP_SELECTED_SOURCE_PROPERTY) as
            | VectorSource
            | undefined;
        if (selectedSource) {
            syncSelectedTransitStopLayer(source, selectedSource, selectedStopId);
        }
    }
}

function createTransitStopStyle(
    feature: Feature | import("ol/Feature").FeatureLike,
    resolution: number
) {
    const isSelected = getIsSelectedTransitStop(feature);
    // Die ausgewählte Haltestelle bleibt immer sichtbar; nur normale Marker werden
    // ab der Resolution-Schwelle ausgeblendet.
    if (!isSelected && resolution >= TRANSIT_STOP_MARKER_MAX_RESOLUTION) {
        return [];
    }

    const label =
        resolution < TRANSIT_STOP_LABEL_MAX_RESOLUTION ? String(feature.get("name") ?? "") : "";
    const routeState = getTransitStopRouteState(feature);
    const isDimmed = routeState === "dimmed" && !isSelected;
    const isRouteStop = routeState === "route" || routeState === "next";
    const isNextStop = routeState === "next";
    // Ausgewählte Haltestelle hat visuell Vorrang vor next/route/dimmed/normal.
    const pinFill = isSelected
        ? transitStopColors.selected
        : isNextStop
          ? transitStopColors.next
          : transitStopColors.normal;
    const strokeWidth = isSelected
        ? TRANSIT_STOP_STROKE_WIDTH_SELECTED
        : isNextStop
          ? TRANSIT_STOP_STROKE_WIDTH_NEXT
          : isRouteStop
            ? TRANSIT_STOP_STROKE_WIDTH_ROUTE
            : TRANSIT_STOP_STROKE_WIDTH_NORMAL;
    const pinScale = isSelected
        ? getSelectedTransitStopScale(resolution)
        : isNextStop
          ? TRANSIT_STOP_SCALE_NEXT
          : isRouteStop
            ? TRANSIT_STOP_SCALE_ROUTE
            : isDimmed
              ? TRANSIT_STOP_SCALE_DIMMED
              : TRANSIT_STOP_SCALE_NORMAL;
    const labelOffsetY =
        isSelected || isNextStop
            ? TRANSIT_STOP_LABEL_OFFSET_Y_LARGE
            : isRouteStop
              ? TRANSIT_STOP_LABEL_OFFSET_Y_ROUTE
              : TRANSIT_STOP_LABEL_OFFSET_Y_NORMAL;
    const iconZIndex = isSelected
        ? TRANSIT_STOP_STYLE_BASE_Z_INDEX + TRANSIT_STOP_Z_OFFSET_SELECTED
        : isNextStop
          ? TRANSIT_STOP_STYLE_BASE_Z_INDEX + TRANSIT_STOP_Z_OFFSET_NEXT
          : isRouteStop
            ? TRANSIT_STOP_STYLE_BASE_Z_INDEX + TRANSIT_STOP_Z_OFFSET_ROUTE
            : TRANSIT_STOP_STYLE_BASE_Z_INDEX + TRANSIT_STOP_Z_OFFSET_NORMAL;
    const labelZIndex = iconZIndex + TRANSIT_STOP_LABEL_Z_OFFSET;
    return [
        new Style({
            image: new Icon({
                src: getTransitStopIconDataUri(pinFill, transitStopColors.halo, strokeWidth),
                anchor: [0.5, 1],
                scale: pinScale,
                opacity: isDimmed ? TRANSIT_STOP_DIMMED_ICON_OPACITY : 1
            }),
            zIndex: iconZIndex
        }),
        new Style({
            text: label
                ? new Text({
                      text: label,
                      offsetY: labelOffsetY,
                      font: TRANSIT_STOP_LABEL_FONT,
                      fill: new Fill({
                          color: isDimmed
                              ? withAlpha(transitStopColors.label, TRANSIT_STOP_DIMMED_LABEL_ALPHA)
                              : transitStopColors.label
                      }),
                      stroke: new Stroke({
                          color: transitStopColors.halo,
                          width: TRANSIT_STOP_LABEL_HALO_WIDTH
                      }),
                      overflow: true
                  })
                : undefined,
            zIndex: labelZIndex
        })
    ];
}

function getTransitStopRouteState(
    feature: Feature | import("ol/Feature").FeatureLike
): TransitStopRouteState {
    const state = feature.get(TRANSIT_STOP_ROUTE_STATE_PROPERTY);
    return state === "dimmed" || state === "route" || state === "next" ? state : "normal";
}

function getIsSelectedTransitStop(feature: Feature | import("ol/Feature").FeatureLike): boolean {
    return !!feature.get(TRANSIT_STOP_SELECTED_PROPERTY);
}

/**
 * Zoomabhängige Skala des ausgewählten Markers. Beim Hineinzoomen bleibt sie auf der
 * Mindestgröße, beim Herauszoomen wächst sie logarithmisch bis zur Maximalgröße, sodass
 * der Marker über alle Zoomstufen klar erkennbar bleibt.
 */
function getSelectedTransitStopScale(resolution: number): number {
    const zoomOutSteps = Math.max(0, Math.log2(resolution / TRANSIT_STOP_MARKER_MAX_RESOLUTION));
    const scale = TRANSIT_STOP_SELECTED_MIN_SCALE + TRANSIT_STOP_SELECTED_SCALE_STEP * zoomOutSteps;
    return Math.min(
        TRANSIT_STOP_SELECTED_MAX_SCALE,
        Math.max(TRANSIT_STOP_SELECTED_MIN_SCALE, scale)
    );
}

/**
 * Wandelt eine Hex-Farbe in einen rgba-Wert mit Alpha um. Fällt bei unerwarteten
 * Formaten auf die Originalfarbe zurück, statt still eine falsche Farbe zu erzeugen.
 */
function withAlpha(color: string, alpha: number): string {
    const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
    const hex = match?.[1];
    if (!hex) {
        return color;
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getTransitStopIconDataUri(fill: string, stroke: string, strokeWidth: number) {
    const cacheKey = `pin-${fill}-${stroke}-${strokeWidth}`;
    const cachedIcon = transitStopIconCache.get(cacheKey);
    if (cachedIcon) {
        return cachedIcon;
    }

    const shadow = withAlpha(TRANSIT_STOP_FALLBACK_LABEL, 0.18);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="38" viewBox="0 0 32 38" aria-hidden="true"><path d="M16 36C12.9 31.2 7 25.2 7 17.4 7 10 11.1 5 16 5s9 5 9 12.4c0 7.8-5.9 13.8-9 18.6Z" fill="${shadow}" transform="translate(0.8 0.8)"/><path d="M16 35C12.6 29.8 6 23.4 6 15.6 6 7.8 10.8 3 16 3s10 4.8 10 12.6c0 7.8-6.6 14.2-10 19.4Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/><rect x="12.15" y="9.85" width="1.65" height="8.7" rx="0.35" fill="${stroke}"/><rect x="18.2" y="9.85" width="1.65" height="8.7" rx="0.35" fill="${stroke}"/><rect x="13.35" y="13.4" width="5.3" height="1.55" rx="0.35" fill="${stroke}"/></svg>`;
    const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    transitStopIconCache.set(cacheKey, dataUri);
    return dataUri;
}
