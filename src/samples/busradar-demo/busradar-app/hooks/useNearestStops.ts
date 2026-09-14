// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { type MapModel } from "@open-pioneer/map";
import type { EventsKey } from "ol/events";
import type BaseLayer from "ol/layer/Base";
import type VectorLayer from "ol/layer/Vector";
import { unByKey } from "ol/Observable";
import { fromLonLat, toLonLat } from "ol/proj";
import type VectorSource from "ol/source/Vector";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { loadTransitDepartures, type TransitDeparture } from "../api/transitDepartures";
import { loadTransitStops } from "../api/transitStops";
import {
    getSelectedTransitStopsVectorLayer,
    getTransitStopsVectorLayer
} from "../map/layers/layerAccess";
import { NEAREST_STOPS_LINES_LAYER_ID, renderNearestStops } from "../map/layers/nearestStopsLayer";
import { ensureTransitStopFeature, setSelectedTransitStop } from "../map/layers/transitStopsLayer";
import { findNearestStops, type NearestStopResult } from "../utils/nearestStops";

const NEAREST_STOPS_MAX_RADIUS_METERS = 500;
const NEAREST_STOPS_MAX_RESULTS = 3;

// Stiller Refresh-Zyklus für offene Abfahrtslisten (an den 30-s-API-Cache ausgerichtet). Sorgt
// dafür, dass vergangene Abfahrten verschwinden und aktuelle Prognosen nachgeladen werden, ohne
// pro Frame Requests auszulösen.
const NEAREST_STOPS_DEPARTURES_REFRESH_MS = 30_000;

// Dauer der reinen Center-Animation beim Fokussieren einer angeklickten Haltestelle.
// Bewusst kurz und subtil; der Zoom bleibt dabei unverändert.
const NEAREST_STOP_FOCUS_ANIMATION_MS = 400;

/** Zustand des Ergebnis-Panels der Umkreissuche. */
export type NearestStopsPanelState =
    | { status: "loading" }
    | { status: "success"; results: NearestStopResult[] }
    | { status: "empty" }
    | { status: "error" };

/** Ladezustand der Abfahrten einer einzelnen Haltestelle im aufgeklappten Accordion-Item. */
export type NearestStopDeparturesState =
    | { status: "loading" }
    | { status: "success"; departures: TransitDeparture[] }
    | { status: "empty" }
    | { status: "error" };

/** Öffentliche API des Umkreissuche-Hooks. */
export interface UseNearestStopsResult {
    /** Ob der Umkreissuche-Modus aktiv ist. */
    nearestStopsActive: boolean;
    /** Schaltet den Modus um (Toolbar-Toggle). */
    toggleNearestStops: () => void;
    /** Schließt Panel und Suchkontext vollständig. */
    closeNearestStops: () => void;
    /** Panel-Zustand; `undefined`, solange noch keine Position gewählt wurde. */
    nearestStopsPanel: NearestStopsPanelState | undefined;
    /**
     * Zentriert die Karte auf die gewählte Haltestelle (nur Center, Zoom bleibt erhalten) und
     * hebt sie über den bestehenden Selected-Stop-Highlight hervor. Öffnet kein Departures-Popup.
     */
    selectNearestStop: (result: NearestStopResult) => void;
    /** ID der aktuell hervorgehobenen Haltestelle; `undefined`, wenn keine ausgewählt ist. */
    selectedStopId: string | undefined;
    /** Aktuell aufgeklappte Accordion-Items (Haltestellen-IDs); Multiple-Modus. */
    openStopIds: string[];
    /**
     * Reagiert auf das Öffnen/Schließen der Accordion-Items (controlled `value`). Neu geöffnete
     * Haltestellen werden zentriert, hervorgehoben und ihre Abfahrten geladen. Schließen blendet
     * nur die Abfahrten aus und lässt Zentrierung/Highlight unberührt.
     */
    onOpenChange: (stopIds: string[]) => void;
    /** Ladezustand der Abfahrten je Haltestelle (Reuse/Caching pro `stopId`). */
    departuresByStop: Record<string, NearestStopDeparturesState>;
    /** Lädt die Abfahrten einer Haltestelle nach einem Fehler erneut. */
    retryDepartures: (stopId: string) => void;
    /**
     * Übernimmt normale Haltestellenklicks, solange ein Ergebnis-Panel geöffnet ist. Treffer aus
     * dem Panel werden dort ausgewählt; ein fremder Stop schließt den Suchkontext und wird danach
     * vom normalen Haltestellen-Popup verarbeitet.
     */
    handleTransitStopClick: (stopId: string) => boolean;
}

interface NearestStopsOptions {
    /** Spiegelt den aktiven Zustand für die bestehenden Klick-Handler (Exklusivität). */
    nearestStopsActiveRef: RefObject<boolean>;
}

/**
 * Umkreissuche „Nächste Haltestellen": Toggle-Modus, in dem ein Kartenklick die bis zu drei
 * nächstgelegenen Haltestellen im 500-m-Radius ermittelt, sie mit Marker und gestrichelten
 * Linien visualisiert und ein Ergebnis-Panel füllt.
 *
 * Der Klick-Handler ist nur im aktiven Modus registriert. `nearestStopsActiveRef` wird gespiegelt,
 * damit die bestehenden Bus-/Haltestellen-Klick-Handler im aktiven Modus zurücktreten
 * (Exklusivität, keine Mehrfachaktionen). Schnell aufeinanderfolgende Klicks sind über eine
 * Request-ID abgesichert: nur das Ergebnis der zuletzt gewählten Position wird übernommen.
 */
export function useNearestStops(
    map: MapModel | undefined,
    { nearestStopsActiveRef }: NearestStopsOptions
): UseNearestStopsResult {
    const [nearestStopsActive, setNearestStopsActive] = useState(false);
    const [nearestStopsPanel, setNearestStopsPanel] = useState<NearestStopsPanelState>();
    const [selectedStopId, setSelectedStopId] = useState<string>();
    const [openStopIds, setOpenStopIds] = useState<string[]>([]);
    const [departuresByStop, setDeparturesByStop] = useState<
        Record<string, NearestStopDeparturesState>
    >({});
    const requestIdRef = useRef(0);
    // Spiegel des aktuellen Ergebnis- und Öffnungszustands, damit die Öffnen-Logik ohne
    // Stale-Closure-Risiko synchron entscheiden kann.
    const latestResultsRef = useRef<NearestStopResult[]>([]);
    const openStopIdsRef = useRef<string[]>([]);
    const nearestStopsPanelRef = useRef<NearestStopsPanelState | undefined>(undefined);
    // Laufende Abfahrts-Requests je Haltestelle (für Abort) und der zuletzt bekannte Status
    // (synchrones Reuse-Gate, um unnötige Requests bei erneutem Öffnen zu vermeiden).
    const departureControllersRef = useRef<Map<string, AbortController>>(new Map());
    const departureStatusRef = useRef<Map<string, NearestStopDeparturesState["status"]>>(new Map());

    // Spiegelt den aktiven Zustand für die Klick-Handler der bestehenden Auswahl-Hooks.
    // Sync im Effect statt im Render: Die Refs werden ausschließlich in Klick-Handlern nach dem
    // Commit gelesen, daher bleibt der aktuelle Wert erhalten, ohne ref.current im Render zu mutieren.
    useEffect(() => {
        nearestStopsActiveRef.current = nearestStopsActive;
        nearestStopsPanelRef.current = nearestStopsPanel;
    }, [nearestStopsActive, nearestStopsPanel, nearestStopsActiveRef]);

    const toggleNearestStops = useCallback(() => setNearestStopsActive((active) => !active), []);

    // Setzt die aktuelle Hervorhebung zurück (geteilter Selected-Stop-Highlight) und leert die
    // gemerkte Auswahl-ID. Wird bei neuer Umkreissuche und beim vollständigen Schließen aufgerufen.
    const clearSelectedStop = useCallback(() => {
        setSelectedStopId(undefined);
        const mainLayer = getTransitStopsVectorLayer(map);
        const selectedLayer = getSelectedTransitStopsVectorLayer(map);
        if (mainLayer && selectedLayer) {
            setSelectedTransitStop(mainLayer, selectedLayer, undefined);
        }
    }, [map]);

    // Bricht laufende Abfahrts-Requests ab und leert Abfahrts-/Öffnungszustand. Wird bei neuer
    // Umkreissuche und beim vollständigen Schließen/Unmount aufgerufen. Highlight bleibt hiervon
    // unberührt.
    const resetNearestStopsDetails = useCallback(() => {
        for (const controller of departureControllersRef.current.values()) {
            controller.abort();
        }
        departureControllersRef.current.clear();
        departureStatusRef.current.clear();
        latestResultsRef.current = [];
        openStopIdsRef.current = [];
        setOpenStopIds([]);
        setDeparturesByStop({});
    }, []);

    const closeNearestStops = useCallback(() => {
        setNearestStopsActive(false);
        requestIdRef.current++;
        const nearestStopsSource = getNearestStopsSource(map);
        if (nearestStopsSource) {
            renderNearestStops(nearestStopsSource);
        }
        setNearestStopsPanel(undefined);
        clearSelectedStop();
        resetNearestStopsDetails();
    }, [map, clearSelectedStop, resetNearestStopsDetails]);

    const selectNearestStop = useCallback(
        (result: NearestStopResult) => {
            if (!map) {
                return;
            }

            // Nur zentrieren, Zoom exakt beibehalten (kein Zoom-Parameter).
            map.olView.cancelAnimations();
            map.olView.animate({
                center: fromLonLat(result.stop.lonLat) as [number, number],
                duration: NEAREST_STOP_FOCUS_ANIMATION_MS
            });

            // Bestehenden Selected-Stop-Highlight wiederverwenden (rot, größer, Reset inklusive).
            // ensureTransitStopFeature sichert das Rendern ab, falls der Haltestellen-Layer nie
            // sichtbar war und seine Source daher leer ist. Kein Departures-Popup.
            const mainLayer = getTransitStopsVectorLayer(map);
            const selectedLayer = getSelectedTransitStopsVectorLayer(map);
            if (mainLayer && selectedLayer) {
                ensureTransitStopFeature(mainLayer, result.stop);
                setSelectedTransitStop(mainLayer, selectedLayer, result.stop.stopId);
            }
            setSelectedStopId(result.stop.stopId);
        },
        [map]
    );

    // Lädt die bis zu drei zeitlich nächsten Abfahrten einer Haltestelle über die bestehende
    // API (`loadTransitDepartures`, inkl. 30-s-Cache). Bereits geladene oder gerade ladende
    // Haltestellen werden nicht erneut angefragt (Reuse), außer `force` erzwingt einen Retry.
    // `silent` unterdrückt den „loading"-Zwischenzustand (für den periodischen Refresh): die
    // bisherige Liste bleibt sichtbar und wird bei Erfolg ersetzt; Fehler lassen sie unverändert.
    const loadDeparturesForStop = useCallback((stopId: string, force = false, silent = false) => {
        const currentStatus = departureStatusRef.current.get(stopId);
        if (!force && (currentStatus === "success" || currentStatus === "loading")) {
            return;
        }

        departureControllersRef.current.get(stopId)?.abort();
        const controller = new AbortController();
        departureControllersRef.current.set(stopId, controller);
        if (!silent) {
            departureStatusRef.current.set(stopId, "loading");
            setDeparturesByStop((prev) => ({ ...prev, [stopId]: { status: "loading" } }));
        }

        loadTransitDepartures(stopId, controller.signal)
            .then((departures) => {
                if (controller.signal.aborted) {
                    return;
                }
                const next: NearestStopDeparturesState =
                    departures.length > 0 ? { status: "success", departures } : { status: "empty" };
                departureStatusRef.current.set(stopId, next.status);
                setDeparturesByStop((prev) => ({ ...prev, [stopId]: next }));
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted || (error as Error)?.name === "AbortError") {
                    return;
                }
                // Beim stillen Refresh die bisherige Liste behalten, statt sie durch einen
                // Fehlerzustand zu ersetzen.
                if (silent) {
                    return;
                }
                departureStatusRef.current.set(stopId, "error");
                setDeparturesByStop((prev) => ({ ...prev, [stopId]: { status: "error" } }));
            });
    }, []);

    const retryDepartures = useCallback(
        (stopId: string) => loadDeparturesForStop(stopId, true),
        [loadDeparturesForStop]
    );

    // Öffnen/Schließen der Accordion-Items (controlled `value`, Multiple-Modus). Neu geöffnete
    // Haltestellen werden zentriert + hervorgehoben (zuletzt geöffnete) und ihre Abfahrten
    // geladen. Schließen löst nichts aus – Highlight/Zentrierung bleiben erhalten.
    const onOpenChange = useCallback(
        (nextIds: string[]) => {
            const prevIds = openStopIdsRef.current;
            const newlyOpened = nextIds.filter((id) => !prevIds.includes(id));
            openStopIdsRef.current = nextIds;
            setOpenStopIds(nextIds);

            if (newlyOpened.length === 0) {
                return;
            }

            const lastOpenedId = newlyOpened[newlyOpened.length - 1];
            const result = latestResultsRef.current.find((r) => r.stop.stopId === lastOpenedId);
            if (result) {
                selectNearestStop(result);
            }
            for (const stopId of newlyOpened) {
                loadDeparturesForStop(stopId);
            }
        },
        [selectNearestStop, loadDeparturesForStop]
    );

    const handleTransitStopClick = useCallback(
        (stopId: string) => {
            if (!nearestStopsPanelRef.current) {
                return false;
            }

            const result = latestResultsRef.current.find((entry) => entry.stop.stopId === stopId);
            if (!result) {
                closeNearestStops();
                return false;
            }

            if (openStopIdsRef.current.includes(stopId)) {
                selectNearestStop(result);
            } else {
                onOpenChange([...openStopIdsRef.current, stopId]);
            }
            return true;
        },
        [closeNearestStops, onOpenChange, selectNearestStop]
    );

    useEffect(() => {
        if (!map || !nearestStopsActive) {
            return;
        }

        const activeMap = map;
        const nearestStopsSource = getNearestStopsSource(activeMap);

        const clickKey: EventsKey = activeMap.olMap.on("singleclick", (event) => {
            const requestId = ++requestIdRef.current;
            const originMapCoord = event.coordinate as [number, number];
            const originLonLat = toLonLat(originMapCoord) as [number, number];

            // Neue Umkreissuche: vorherige Hervorhebung und aufgeklappte Abfahrten zurücksetzen.
            clearSelectedStop();
            resetNearestStopsDetails();

            // Sofort: alte Features vollständig ersetzen (nur Marker), Panel auf „laden".
            if (nearestStopsSource) {
                renderNearestStops(nearestStopsSource, { originMapCoord, targetMapCoords: [] });
            }
            setNearestStopsPanel({ status: "loading" });

            void loadTransitStops()
                .then((stops) => {
                    // Race-Schutz: nur das Ergebnis des letzten Klicks übernehmen.
                    if (requestId !== requestIdRef.current) {
                        return;
                    }

                    const results = findNearestStops(originLonLat, stops, {
                        maxRadiusMeters: NEAREST_STOPS_MAX_RADIUS_METERS,
                        maxResults: NEAREST_STOPS_MAX_RESULTS
                    });
                    const targetMapCoords = results.map(
                        (result) => fromLonLat(result.stop.lonLat) as [number, number]
                    );
                    if (nearestStopsSource) {
                        renderNearestStops(nearestStopsSource, { originMapCoord, targetMapCoords });
                    }
                    // Ergebnisse für die Öffnen-Logik (Zentrieren/Abfahrten je Item) bereitstellen.
                    latestResultsRef.current = results;
                    setNearestStopsPanel(
                        results.length > 0 ? { status: "success", results } : { status: "empty" }
                    );
                })
                .catch(() => {
                    if (requestId !== requestIdRef.current) {
                        return;
                    }
                    // Marker der gewählten Position bleibt sichtbar; Panel meldet den Fehler.
                    setNearestStopsPanel({ status: "error" });
                });
        });

        return () => {
            unByKey(clickKey);
        };
    }, [map, nearestStopsActive, clearSelectedStop, resetNearestStopsDetails]);

    // Echter Map-Wechsel/Unmount beendet den imperativen Suchkontext. Toggle-off läuft bewusst
    // nicht über diesen Cleanup und erhält Panel, Ergebnisse, Selection und Kartenfeatures.
    useEffect(() => {
        if (!map) {
            return;
        }
        return closeNearestStops;
    }, [map, closeNearestStops]);

    // Periodischer stiller Refresh der aktuell aufgeklappten Abfahrtslisten: aktualisiert Prognosen
    // und lässt vergangene Abfahrten verschwinden, ohne „loading"-Flackern und ohne Frame-Requests.
    useEffect(() => {
        if (!nearestStopsPanel) {
            return;
        }
        const intervalId = window.setInterval(() => {
            for (const stopId of openStopIdsRef.current) {
                loadDeparturesForStop(stopId, true, true);
            }
        }, NEAREST_STOPS_DEPARTURES_REFRESH_MS);
        return () => window.clearInterval(intervalId);
    }, [nearestStopsPanel, loadDeparturesForStop]);

    return {
        nearestStopsActive,
        toggleNearestStops,
        closeNearestStops,
        nearestStopsPanel,
        selectNearestStop,
        selectedStopId,
        openStopIds,
        onOpenChange,
        departuresByStop,
        retryDepartures,
        handleTransitStopClick
    };
}

function getNearestStopsSource(map: MapModel | undefined) {
    const nearestStopsLayer = map?.layers.getLayerById(NEAREST_STOPS_LINES_LAYER_ID) as
        | { olLayer?: BaseLayer }
        | undefined;
    return (
        (nearestStopsLayer?.olLayer as VectorLayer<VectorSource> | undefined)?.getSource() ??
        undefined
    );
}
