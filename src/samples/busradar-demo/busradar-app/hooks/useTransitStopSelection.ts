// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { type MapModel } from "@open-pioneer/map";
import type { EventsKey } from "ol/events";
import type { FeatureLike } from "ol/Feature";
import type BaseLayer from "ol/layer/Base";
import { unByKey } from "ol/Observable";
import { useIntl } from "open-pioneer:react-hooks";
import { useEffect, useRef, useState, type RefObject } from "react";
import { loadTransitDepartures, type TransitDeparture } from "../api/transitDepartures";
import { BUSRADAR_LAYER_ID } from "../map/layers/busradarLayer";
import {
    getSelectedTransitStopsVectorLayer,
    getTransitStopsVectorLayer
} from "../map/layers/layerAccess";
import {
    getSelectedTransitStopId,
    setSelectedTransitStop,
    TRANSIT_STOPS_LAYER_ID
} from "../map/layers/transitStopsLayer";
import type { TransitStopPopupState, TransitStopSummary } from "../types";
import { getOptionalString } from "../utils/valueUtils";

// Stiller Refresh-Zyklus des offenen Haltestellen-Popups (an den 30-s-API-Cache ausgerichtet):
// aktualisiert Prognosen und lässt vergangene Abfahrten verschwinden, ohne Frame-Requests.
const TRANSIT_STOP_DEPARTURES_REFRESH_MS = 30_000;

interface TransitStopSelectionOptions {
    /** Ob der Umkreissuche-Modus aktiv ist; dann tritt die Haltestellenauswahl beim Klick zurück. */
    nearestStopsActiveRef: RefObject<boolean>;
    /** Arbitriert normale Stop-Klicks gegen ein erhaltenes Nearest-Stops-Panel. */
    handleNearestStopsTransitStopClick: (stopId: string) => boolean;
}

/**
 * Kapselt die Haltestellen-Auswahl: Sichtbarkeit des Haltestellen-Layers, Klick-Auswahl mit
 * Live-Abfahrts-Popup und das Schließen der Auswahl.
 */
export function useTransitStopSelection(
    map: MapModel | undefined,
    { nearestStopsActiveRef, handleNearestStopsTransitStopClick }: TransitStopSelectionOptions
) {
    const intl = useIntl();
    const [transitStopsLayerIsActive, setTransitStopsLayerIsActive] = useState(true);
    const [transitStopPopup, setTransitStopPopup] = useState<TransitStopPopupState>();
    const transitStopDeparturesAbortControllerRef = useRef<AbortController | undefined>(undefined);
    const transitStopRefreshAbortControllerRef = useRef<AbortController | undefined>(undefined);
    const selectedTransitStopIdRef = useRef<string | undefined>(undefined);
    const handleNearestStopsTransitStopClickRef = useRef(handleNearestStopsTransitStopClick);
    handleNearestStopsTransitStopClickRef.current = handleNearestStopsTransitStopClick;

    function updateSelectedTransitStop(stopId?: string) {
        const mainLayer = getTransitStopsVectorLayer(map);
        const selectedLayer = getSelectedTransitStopsVectorLayer(map);
        if (mainLayer && selectedLayer) {
            setSelectedTransitStop(mainLayer, selectedLayer, stopId);
        }
    }

    function closeTransitStopInfo() {
        transitStopDeparturesAbortControllerRef.current?.abort();
        transitStopDeparturesAbortControllerRef.current = undefined;
        const selectedStopId = selectedTransitStopIdRef.current;
        if (selectedStopId) {
            const mainLayer = getTransitStopsVectorLayer(map);
            if (mainLayer && getSelectedTransitStopId(mainLayer) === selectedStopId) {
                updateSelectedTransitStop(undefined);
            }
            selectedTransitStopIdRef.current = undefined;
        }
        setTransitStopPopup(undefined);
    }
    function toggleTransitStopsLayer(isActive: boolean) {
        setTransitStopsLayerIsActive(isActive);
        map?.layers.getLayerById(TRANSIT_STOPS_LAYER_ID)?.setVisible(isActive);

        if (!isActive) {
            closeTransitStopInfo();
        }
    }

    useEffect(() => {
        const isVisible = transitStopsLayerIsActive;
        map?.layers.getLayerById(TRANSIT_STOPS_LAYER_ID)?.setVisible(isVisible);

        if (!isVisible) {
            closeTransitStopInfo();
        }
        // closeTransitStopInfo haengt nur transitiv von `map` ab, das bereits in den Deps steht.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, transitStopsLayerIsActive]);

    useEffect(() => {
        if (!map || !transitStopsLayerIsActive) {
            closeTransitStopInfo();
            return;
        }

        const activeMap = map;
        const busradarLayer = activeMap.layers.getLayerById(BUSRADAR_LAYER_ID) as
            | { olLayer?: BaseLayer }
            | undefined;
        const busradarOlLayer = busradarLayer?.olLayer;
        // Layer-Stapelreihenfolge verwaltet Trails über die Collection-Order (siehe services.ts);
        // hier nur die nativen OL-Layer auflösen.
        const transitStopsOlLayer = getTransitStopsVectorLayer(activeMap);
        if (!transitStopsOlLayer) {
            return;
        }

        // Der Selected-Stop-Layer liegt bewusst oberhalb des Busradar-Fahrzeug-Layers (über die
        // Registrierungsreihenfolge in services.ts), damit der rote Marker über Bus-Markern und
        // Bus-Labels sichtbar bleibt.
        const selectedTransitStopsOlLayer = getSelectedTransitStopsVectorLayer(activeMap);

        // Sonderfall Daten-Refresh: Wenn die aktuell ausgewählte Haltestelle nicht mehr in
        // den Live-Daten enthalten ist, entfernt der Layer-Controller ihr Feature. Dann
        // Auswahl und Popup schließen, damit kein veralteter roter Marker stehen bleibt.
        const transitStopsSource = transitStopsOlLayer.getSource();
        const removeFeatureKey = transitStopsSource?.on("removefeature", (removeEvent) => {
            const removedStopId = String(
                removeEvent.feature?.get("stopId") ?? removeEvent.feature?.getId() ?? ""
            );
            const selectedStopId = getSelectedTransitStopId(transitStopsOlLayer);
            if (removedStopId && removedStopId === selectedStopId) {
                closeTransitStopInfo();
            }
        });

        function renderTransitStopOverlay(
            summary: TransitStopSummary,
            departures?: TransitDeparture[],
            options?: { loading?: boolean; error?: string }
        ) {
            setTransitStopPopup({
                summary,
                departures,
                loading: options?.loading,
                error: options?.error
            });
        }

        const clickKey: EventsKey = activeMap.olMap.on("singleclick", (event) => {
            // Im Umkreissuche-Modus ist der Klick exklusiv für diese Suche; keine Haltestellenauswahl.
            if (nearestStopsActiveRef.current) {
                return;
            }

            let selectedBusFeature: FeatureLike | undefined;
            if (busradarOlLayer) {
                activeMap.olMap.forEachFeatureAtPixel(
                    event.pixel,
                    (feature, layer) => {
                        if (layer === busradarOlLayer) {
                            selectedBusFeature = feature;
                            return true;
                        }
                        return undefined;
                    },
                    { hitTolerance: 8 }
                );
            }

            if (selectedBusFeature) {
                return;
            }

            let selectedFeature: FeatureLike | undefined;
            activeMap.olMap.forEachFeatureAtPixel(
                event.pixel,
                (feature, layer) => {
                    // Auch ein Klick auf den bereits ausgewählten roten Marker (Selected-Layer)
                    // gilt als Haltestellen-Treffer, damit die Auswahl erhalten bleibt und die
                    // Abfahrten erneut geladen werden.
                    if (layer === transitStopsOlLayer || layer === selectedTransitStopsOlLayer) {
                        selectedFeature = feature;
                        return true;
                    }
                    return undefined;
                },
                { hitTolerance: 8 }
            );

            if (!selectedFeature) {
                closeTransitStopInfo();
                return;
            }

            const summary = getTransitStopSummary(selectedFeature);
            if (handleNearestStopsTransitStopClickRef.current(summary.stopId)) {
                return;
            }
            selectedTransitStopIdRef.current = summary.stopId;
            updateSelectedTransitStop(summary.stopId);
            transitStopDeparturesAbortControllerRef.current?.abort();
            transitStopDeparturesAbortControllerRef.current = undefined;

            renderTransitStopOverlay(summary, undefined, { loading: true });
            const abortController = new AbortController();
            transitStopDeparturesAbortControllerRef.current = abortController;

            void loadTransitDepartures(summary.stopId, abortController.signal)
                .then((departures) => {
                    if (!abortController.signal.aborted) {
                        renderTransitStopOverlay(summary, departures);
                    }
                })
                .catch((error) => {
                    if (!abortController.signal.aborted) {
                        renderTransitStopOverlay(summary, undefined, {
                            error:
                                error instanceof Error
                                    ? error.message
                                    : intl.formatMessage({ id: "transitStops.loadError" })
                        });
                    }
                })
                .finally(() => {
                    if (transitStopDeparturesAbortControllerRef.current === abortController) {
                        transitStopDeparturesAbortControllerRef.current = undefined;
                    }
                });
        });

        return () => {
            unByKey(clickKey);
            if (removeFeatureKey) {
                unByKey(removeFeatureKey);
            }
            closeTransitStopInfo();
        };
        // closeTransitStopInfo haengt nur transitiv von `map` ab, das bereits in den Deps steht.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, transitStopsLayerIsActive]);

    // Periodischer stiller Refresh des offenen Popups: aktualisiert die Abfahrten der aktuell
    // ausgewählten Haltestelle (Prognosen/entfallene Abfahrten), ohne „loading" anzuzeigen und
    // ohne die bisherige Liste bei einem Fehler zu verwerfen.
    const openPopupStopId = transitStopPopup?.summary.stopId;
    useEffect(() => {
        if (!map || !transitStopsLayerIsActive || !openPopupStopId) {
            return;
        }
        const intervalId = window.setInterval(() => {
            transitStopRefreshAbortControllerRef.current?.abort();
            const controller = new AbortController();
            transitStopRefreshAbortControllerRef.current = controller;
            loadTransitDepartures(openPopupStopId, controller.signal)
                .then((departures) => {
                    if (controller.signal.aborted) {
                        return;
                    }
                    setTransitStopPopup((prev) =>
                        prev && prev.summary.stopId === openPopupStopId
                            ? { ...prev, departures, loading: false, error: undefined }
                            : prev
                    );
                })
                .catch(() => {
                    // Stiller Refresh: bisherige Liste bei Fehler unverändert lassen.
                });
        }, TRANSIT_STOP_DEPARTURES_REFRESH_MS);
        return () => {
            window.clearInterval(intervalId);
            transitStopRefreshAbortControllerRef.current?.abort();
            transitStopRefreshAbortControllerRef.current = undefined;
        };
    }, [map, transitStopsLayerIsActive, openPopupStopId]);

    return {
        transitStopsLayerIsActive,
        toggleTransitStopsLayer,
        transitStopPopup,
        closeTransitStopInfo
    };
}

function getTransitStopSummary(feature: FeatureLike): TransitStopSummary {
    const stopId = String(feature.get("stopId") ?? feature.getId() ?? "");
    return {
        stopId,
        parentStationId: getOptionalString(feature.get("parentStationId")),
        name: String(feature.get("name") ?? "Haltestelle"),
        platform: getOptionalString(feature.get("platform"))
    };
}
