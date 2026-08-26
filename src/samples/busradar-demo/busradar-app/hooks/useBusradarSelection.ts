// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { type MapModel } from "@open-pioneer/map";
import type { FeatureLike } from "ol/Feature";
import type { EventsKey } from "ol/events";
import Point from "ol/geom/Point";
import type BaseLayer from "ol/layer/Base";
import type VectorLayer from "ol/layer/Vector";
import { unByKey } from "ol/Observable";
import type VectorSource from "ol/source/Vector";
import { useEffect, useRef, useState, type RefObject } from "react";
import { loadBusradarTripStops, resolveBusradarStopNames } from "../api/busradarTripDetails";
import {
    createBusradarAutoFollow,
    type BusradarAutoFollowController
} from "../busradar/controllers/createBusradarAutoFollow";
import {
    createBusradarInfoOverlay,
    type BusradarInfoOverlayController
} from "../busradar/controllers/createBusradarInfoOverlay";
import { createBusradarTrackingDebug } from "../busradar/controllers/createBusradarTrackingDebug";
import {
    BUSRADAR_CONTROLLER_PROPERTY,
    BUSRADAR_LAYER_ID,
    projectBusradarCoordinateOnRoute,
    type BusradarControllerApi,
    type BusradarRouteSplit,
    type BusradarSelectedVehicle
} from "../map/layers/busradarLayer";
import { BUSRADAR_ROUTE_LAYER_ID, renderBusradarRoute } from "../map/layers/busradarRouteLayer";
import { getTransitStopsVectorLayer } from "../map/layers/layerAccess";
import {
    applyTransitStopRouteHighlight,
    clearTransitStopRouteHighlight,
    TRANSIT_STOPS_LAYER_ID
} from "../map/layers/transitStopsLayer";
import type { BusradarSelectionDetails } from "../types";
import { lineMatchesBusradarFilter, normalizeBusradarLine } from "../utils/busradarLineUtils";
import { resolveBusradarNextStop } from "../utils/busradarNextStop";
import { deriveStopsStatus } from "../utils/busradarSelectionDetails";
import { getBusradarTrackingBoxes } from "../utils/busradarTracking";
import { getOptionalNumber, getOptionalString, isDefinedString } from "../utils/valueUtils";

const BUSRADAR_ROUTE_REFRESH_MS = 500;
// Drosselung der „nächste Haltestelle"-/ETA-Neuberechnung im Frame-Notifier (läuft pro rAF-Frame).
const BUSRADAR_NEXT_STOP_REFRESH_MS = 10_000;
const BUSRADAR_STOP_PASS_TOLERANCE_METERS = 15;
const BUSRADAR_ROUTE_SNAP_MAX_METERS = 100;

/**
 * Ergebnis einer programmatischen Bus-Auswahl über eine Abfahrtszeile.
 * `selected` = Bus eindeutig zugeordnet und ausgewählt. Alle anderen Fälle lassen die bestehende
 * Auswahl unverändert und werden bewusst getrennt gehalten (das UI zeigt zunächst denselben
 * Hinweis): `unmapped` = keine Trip-ID vorhanden; `not-live` = kein aktuell sendendes Fahrzeug;
 * `filtered` = Fahrzeug live, aber durch den aktiven Linienfilter ausgeblendet.
 */
export type BusradarDepartureSelectionStatus = "selected" | "unmapped" | "not-live" | "filtered";

interface BusradarSelectionOptions {
    /** Mutable Auswahl-Details für Overlay- und Live-Update-Logik. */
    selectedBusradarDetailsRef: RefObject<BusradarSelectionDetails | undefined>;
    /** Ob links ein Panel (Layer-Drawer) offen ist; beeinflusst den Auto-Follow-Bereich. */
    leftMapPanelIsActiveRef: RefObject<boolean>;
    /** Ob der Umkreissuche-Modus aktiv ist; dann tritt die Busauswahl beim Klick zurück. */
    nearestStopsActiveRef: RefObject<boolean>;
    /**
     * Wird mit einer Funktion befüllt, die einen Live-Bus programmatisch anhand seiner Trip-ID
     * (`fahrtbezeichner`) auswählt – für den Klick auf eine Abfahrtszeile. Nutzt exakt dieselbe
     * Auswahl-/Tracking-/Route-/Detaillogik wie der Kartenklick.
     */
    selectBusradarVehicleByIdRef: RefObject<
        | ((
              tripId: string | undefined,
              focusedStopEta?: BusradarSelectionDetails["focusedStopEta"]
          ) => BusradarDepartureSelectionStatus)
        | undefined
    >;
}

/** Öffentliche API des Busradar-Auswahl-Hooks: Linienfilter-State und zugehörige Handler. */
export interface UseBusradarSelectionResult {
    /** Alle aktuell vom Controller gemeldeten Linien (für die Filter-Buttons). */
    busradarAvailableLines: string[];
    /** Aktuell aktive Linienauswahl (leer = alle sichtbar). */
    busradarSelectedLines: string[];
    /**
     * Trip-ID (`fahrtbezeichner`) des aktuell ausgewählten Live-Busses; `undefined`, wenn keiner
     * ausgewählt ist. Dient beiden Haltestellen-Ansichten als stabile Quelle für die
     * Zeilen-Hervorhebung der ausgewählten Abfahrt.
     */
    selectedBusradarTripId: string | undefined;
    /** Linie des aktuell ausgewählten Live-Busses; `undefined` ohne aktive Busauswahl. */
    selectedBusradarLine: string | undefined;
    /** Fügt eine Linie zum Filter hinzu (normalisiert, dedupliziert). */
    addBusradarLineFilter: (line: string) => void;
    /** Entfernt eine Linie aus dem Filter. */
    removeBusradarLineFilter: (line: string) => void;
    /** Setzt den Linienfilter zurück (alle sichtbar). */
    resetBusradarLineFilter: () => void;
}

/**
 * Kapselt die komplette Busradar-Auswahl: Fahrzeug-Auswahl per Kartenklick, temporäre Route,
 * Info-Popup, Auto-Follow/Tracking (inkl. flag-getriggertem Debug-Overlay) und den Linienfilter.
 * Gibt den Linienfilter-State und die zugehörigen Handler für das Layer-Panel zurück.
 */
export function useBusradarSelection(
    map: MapModel | undefined,
    {
        selectedBusradarDetailsRef,
        leftMapPanelIsActiveRef,
        nearestStopsActiveRef,
        selectBusradarVehicleByIdRef
    }: BusradarSelectionOptions
): UseBusradarSelectionResult {
    const [busradarAvailableLines, setBusradarAvailableLines] = useState<string[]>([]);
    const [busradarSelectedLines, setBusradarSelectedLines] = useState<string[]>([]);
    const [selectedBusradarTripId, setSelectedBusradarTripId] = useState<string | undefined>(
        undefined
    );
    const [selectedBusradarLine, setSelectedBusradarLine] = useState<string | undefined>(undefined);
    const busradarInfoOverlayControllerRef = useRef<BusradarInfoOverlayController | undefined>(
        undefined
    );
    const busradarRouteLayerRef = useRef<VectorLayer<VectorSource> | undefined>(undefined);
    const busradarSelectionAbortControllerRef = useRef<AbortController | undefined>(undefined);
    const busradarSelectionRequestIdRef = useRef(0);
    const selectedBusradarIdRef = useRef<string | undefined>(undefined);
    const selectedBusradarRouteTripIdRef = useRef<string | undefined>(undefined);
    const selectedBusradarRouteUpdatedAtRef = useRef(0);
    const selectedBusradarStopSequenceRef = useRef<number | undefined>(undefined);
    // Priorisierte Zielhaltestelle einer angeklickten Abfahrt (Override-Input der nextStop-Berechnung).
    const focusedStopRef = useRef<BusradarSelectionDetails["focusedStopEta"]>(undefined);
    // Zeitstempel der letzten nextStop-/ETA-Neuberechnung (Drosselung im Frame-Notifier).
    const nextStopUpdatedAtRef = useRef(0);
    const busradarVehicleUpdateUnsubscribeRef = useRef<(() => void) | undefined>(undefined);
    const busradarClearSelectionRef = useRef<(() => void) | undefined>(undefined);
    const busradarControllerRef = useRef<BusradarControllerApi | undefined>(undefined);
    const busradarAutoFollowControllerRef = useRef<BusradarAutoFollowController | undefined>(
        undefined
    );

    function closeBusradarInfo() {
        selectedBusradarIdRef.current = undefined;
        selectedBusradarRouteTripIdRef.current = undefined;
        selectedBusradarRouteUpdatedAtRef.current = 0;
        selectedBusradarDetailsRef.current = undefined;
        selectedBusradarStopSequenceRef.current = undefined;
        focusedStopRef.current = undefined;
        nextStopUpdatedAtRef.current = 0;
        setSelectedBusradarTripId(undefined);
        setSelectedBusradarLine(undefined);
        busradarAutoFollowControllerRef.current?.stop();
        busradarVehicleUpdateUnsubscribeRef.current?.();
        busradarVehicleUpdateUnsubscribeRef.current = undefined;
        busradarClearSelectionRef.current?.();
        busradarSelectionRequestIdRef.current++;
        busradarSelectionAbortControllerRef.current?.abort();
        busradarSelectionAbortControllerRef.current = undefined;
        busradarInfoOverlayControllerRef.current?.destroy();
        busradarRouteLayerRef.current?.getSource()?.clear();
        clearTransitStopRouteHighlightForMap();
    }

    function clearTransitStopRouteHighlightForMap() {
        const transitStopsOlLayer = getTransitStopsVectorLayer(map);
        if (transitStopsOlLayer) {
            clearTransitStopRouteHighlight(transitStopsOlLayer);
        }
    }

    function applyTransitStopRouteHighlightForMap(stopIds: string[], nextStopId?: string) {
        const transitStopsOlLayer = getTransitStopsVectorLayer(map);
        if (transitStopsOlLayer) {
            applyTransitStopRouteHighlight(transitStopsOlLayer, stopIds, nextStopId);
        }
    }

    function selectedBusradarVehicleHasPassedNextStop(
        vehicle: BusradarSelectedVehicle,
        details: BusradarSelectionDetails
    ) {
        const nextStopId = details.tripStops?.stops.find((stop) => stop.isNext)?.stopId;
        if (!nextStopId) {
            return true;
        }

        const route = details.routeSplit?.route;
        if (!route) {
            return false;
        }

        const transitStopsSource = getTransitStopsVectorLayer(map)?.getSource();
        const stopFeature = transitStopsSource?.getFeatureById(nextStopId) ?? undefined;
        const stopGeometry = stopFeature?.getGeometry();
        if (!(stopGeometry instanceof Point)) {
            return false;
        }

        const vehicleProjection = projectBusradarCoordinateOnRoute(
            route,
            vehicle.coordinate as [number, number]
        );
        const stopProjection = projectBusradarCoordinateOnRoute(
            route,
            stopGeometry.getCoordinates() as [number, number]
        );
        if (!vehicleProjection || !stopProjection) {
            return false;
        }
        if (
            vehicleProjection.snapDistanceMeters > BUSRADAR_ROUTE_SNAP_MAX_METERS ||
            stopProjection.snapDistanceMeters > BUSRADAR_ROUTE_SNAP_MAX_METERS
        ) {
            return false;
        }

        return (
            vehicleProjection.distanceAlongRoute >
            stopProjection.distanceAlongRoute + BUSRADAR_STOP_PASS_TOLERANCE_METERS
        );
    }

    function setBusradarLineFilter(nextLines: string[]) {
        setBusradarSelectedLines(nextLines);
        busradarControllerRef.current?.setLineFilter(nextLines);

        const selectedVehicleId = selectedBusradarIdRef.current;
        if (!selectedVehicleId || nextLines.length === 0) {
            return;
        }

        const selectedVehicle = busradarControllerRef.current?.getVehicleById(selectedVehicleId);
        if (!lineMatchesBusradarFilter(selectedVehicle?.properties.linientext, nextLines)) {
            closeBusradarInfo();
        }
    }

    function addBusradarLineFilter(line: string) {
        const normalizedLine = normalizeBusradarLine(line);
        if (!normalizedLine) {
            return;
        }
        if (
            busradarSelectedLines.some(
                (selectedLine) => normalizeBusradarLine(selectedLine) === normalizedLine
            )
        ) {
            return;
        }

        const matchingAvailableLine = busradarAvailableLines.find(
            (availableLine) => normalizeBusradarLine(availableLine) === normalizedLine
        );
        setBusradarLineFilter([...busradarSelectedLines, matchingAvailableLine ?? line.trim()]);
    }

    function removeBusradarLineFilter(line: string) {
        const normalizedLine = normalizeBusradarLine(line);
        setBusradarLineFilter(
            busradarSelectedLines.filter(
                (selectedLine) => normalizeBusradarLine(selectedLine) !== normalizedLine
            )
        );
    }

    function resetBusradarLineFilter() {
        setBusradarLineFilter([]);
    }

    useEffect(() => {
        if (!map) {
            return;
        }

        const activeMap = map;
        const busradarLayer = activeMap.layers.getLayerById(BUSRADAR_LAYER_ID) as
            | { olLayer?: BaseLayer }
            | undefined;
        const busradarOlLayer = busradarLayer?.olLayer;
        const transitStopsLayer = activeMap.layers.getLayerById(TRANSIT_STOPS_LAYER_ID) as
            | { olLayer?: BaseLayer }
            | undefined;
        const transitStopsOlLayer = transitStopsLayer?.olLayer;
        const controller = busradarOlLayer?.get(BUSRADAR_CONTROLLER_PROPERTY) as
            | BusradarControllerApi
            | undefined;
        if (!busradarOlLayer || !controller) {
            return;
        }
        const busradarController = controller;
        busradarControllerRef.current = busradarController;
        busradarController.setLineFilter(busradarSelectedLines);
        const unsubscribeAvailableLines =
            busradarController.subscribeToAvailableLines(setBusradarAvailableLines);
        busradarClearSelectionRef.current = () =>
            busradarController.setSelectedVehicleId(undefined);

        // Route-Layer ist in services.ts als Trails-Layer registriert; hier nur die Source
        // auflösen und zur Laufzeit befüllen/leeren. Die Stapelreihenfolge verwaltet Trails
        // über die Collection-Order (Route unter Haltestellen- und Fahrzeug-Markern).
        const routeLayer = activeMap.layers.getLayerById(BUSRADAR_ROUTE_LAYER_ID) as
            | { olLayer?: BaseLayer }
            | undefined;
        const routeOlLayer = routeLayer?.olLayer as VectorLayer<VectorSource> | undefined;
        const routeSource = routeOlLayer?.getSource() ?? undefined;
        busradarRouteLayerRef.current = routeOlLayer;

        const infoOverlay = createBusradarInfoOverlay({
            map: activeMap,
            onClose: closeBusradarInfo
        });
        busradarInfoOverlayControllerRef.current = infoOverlay;

        const trackingDebug = createBusradarTrackingDebug({
            map: activeMap,
            getTrackingBoxes: getBusradarTrackingBoxesForMap
        });
        const handleTrackingDebugUpdate = () => trackingDebug.update();

        function renderBusradarOverlay(
            coordinate: number[],
            details: BusradarSelectionDetails,
            error?: string
        ) {
            selectedBusradarDetailsRef.current = details;
            infoOverlay.render(coordinate, details, error);
        }

        // Berechnet die darzustellende „nächste Haltestelle" (allgemein bzw. priorisierte
        // Abfahrt-Zielhaltestelle) zentral aus den bereits geladenen Trip-Stops und ergänzt sie in
        // den Details. Setzt den Drossel-Zeitstempel zurück, damit der Frame-Notifier nicht sofort
        // erneut rechnet. Keine eigene Trip-Stops-/ETA-Parallellogik.
        function withNextStop(
            vehicle: BusradarSelectedVehicle,
            details: BusradarSelectionDetails
        ): BusradarSelectionDetails {
            nextStopUpdatedAtRef.current = performance.now();
            return {
                ...details,
                nextStop: resolveBusradarNextStop(
                    {
                        tripStops: details.tripStops,
                        vehicleSequence: getOptionalNumber(vehicle.properties.sequenz),
                        focusedStop: focusedStopRef.current
                    },
                    Date.now() / 1000
                )
            };
        }

        function renderSelectedRoute(routeSplit: BusradarRouteSplit | undefined) {
            if (!routeSource) {
                return;
            }
            renderBusradarRoute(routeSource, routeSplit);
        }

        function getBusradarTrackingBoxesForMap(mapSize: [number, number]) {
            return getBusradarTrackingBoxes(mapSize, {
                leftPanelActive: leftMapPanelIsActiveRef.current,
                overlayHeight: infoOverlay.getElementHeight()
            });
        }

        const autoFollow = createBusradarAutoFollow({
            map: activeMap,
            getSelectedVehicleId: () => selectedBusradarIdRef.current,
            getVehicleById: (id) => busradarController.getVehicleById(id),
            getTrackingBoxes: getBusradarTrackingBoxesForMap
        });
        busradarAutoFollowControllerRef.current = autoFollow;
        const handleAutoFollowPause = () => autoFollow.pauseAfterUserInteraction();
        const handleAutoFollowInterrupt = () => autoFollow.interruptAfterUserInteraction();

        const manualMoveKeys: EventsKey[] = [
            activeMap.olMap.on("movestart", handleAutoFollowPause),
            activeMap.olMap.on("pointerdrag", handleAutoFollowInterrupt),
            activeMap.olView.on("change:resolution", handleAutoFollowInterrupt)
        ];
        const mapViewport = activeMap.olMap.getViewport();
        mapViewport.addEventListener("wheel", handleAutoFollowInterrupt, {
            passive: true
        });
        const debugUpdateKeys: EventsKey[] = [
            activeMap.olMap.on("moveend", handleTrackingDebugUpdate),
            activeMap.olMap.on("change:size", handleTrackingDebugUpdate)
        ];
        window.addEventListener("resize", handleTrackingDebugUpdate);
        trackingDebug.start();

        function subscribeToSelectedBusradarVehicle(vehicleId: string) {
            busradarVehicleUpdateUnsubscribeRef.current?.();
            busradarVehicleUpdateUnsubscribeRef.current =
                busradarController.subscribeToVehicleUpdates(vehicleId, (vehicle) => {
                    if (!vehicle || selectedBusradarIdRef.current !== vehicleId) {
                        closeBusradarInfo();
                        return;
                    }

                    const currentDetails = selectedBusradarDetailsRef.current;
                    if (currentDetails) {
                        // Pro Frame wird nur die Fahrzeugposition aktualisiert. Die „nächste
                        // Haltestelle"/ETA wird gedrosselt (~10 s) neu berechnet und danach im
                        // gespeicherten Detail-Objekt weitergetragen – kein Request pro Frame.
                        const shouldRefreshNextStop =
                            performance.now() - nextStopUpdatedAtRef.current >=
                            BUSRADAR_NEXT_STOP_REFRESH_MS;
                        const updatedDetails = shouldRefreshNextStop
                            ? withNextStop(vehicle, { ...currentDetails, vehicle })
                            : { ...currentDetails, vehicle };
                        renderBusradarOverlay(vehicle.coordinate, updatedDetails);
                    } else {
                        infoOverlay.setPosition(vehicle.coordinate);
                    }

                    const currentSequence = getOptionalNumber(vehicle.properties.sequenz);
                    if (
                        currentDetails &&
                        currentSequence !== undefined &&
                        selectedBusradarStopSequenceRef.current !== currentSequence
                    ) {
                        const fahrtbezeichner = vehicle.properties.fahrtbezeichner;
                        const fplId = currentDetails.routeSplit?.route.properties.fpl_id;
                        const abortController = busradarSelectionAbortControllerRef.current;
                        if (
                            fahrtbezeichner &&
                            fplId &&
                            abortController &&
                            selectedBusradarVehicleHasPassedNextStop(vehicle, currentDetails)
                        ) {
                            selectedBusradarStopSequenceRef.current = currentSequence;
                            const requestId = busradarSelectionRequestIdRef.current;
                            void loadBusradarTripStops(
                                { fahrtbezeichner, fplId, currentSequence },
                                abortController.signal
                            )
                                .then((tripStops) => {
                                    if (
                                        abortController.signal.aborted ||
                                        busradarSelectionRequestIdRef.current !== requestId ||
                                        selectedBusradarIdRef.current !== vehicleId
                                    ) {
                                        return;
                                    }

                                    const latestVehicle =
                                        busradarController.getVehicleById(vehicleId) ?? vehicle;
                                    const latestDetails = selectedBusradarDetailsRef.current;
                                    if (!latestDetails) {
                                        return;
                                    }

                                    const startStopName =
                                        tripStops.startStopName ?? latestDetails.startStopName;
                                    const endStopName =
                                        tripStops.endStopName ?? latestDetails.endStopName;
                                    const updatedDetails = {
                                        ...latestDetails,
                                        vehicle: latestVehicle,
                                        tripStops,
                                        startStopName,
                                        endStopName,
                                        stopsStatus: deriveStopsStatus({
                                            hasStaticStopSequence: tripStops.hasStaticStopSequence,
                                            startStopName,
                                            endStopName
                                        })
                                    } satisfies BusradarSelectionDetails;
                                    applyTransitStopRouteHighlightForMap(
                                        tripStops.allStopIds,
                                        tripStops.stops.find((stop) => stop.isNext)?.stopId
                                    );
                                    renderBusradarOverlay(
                                        latestVehicle.coordinate,
                                        withNextStop(latestVehicle, updatedDetails)
                                    );
                                })
                                .catch((error) => {
                                    if ((error as Error).name !== "AbortError") {
                                        console.warn(
                                            "Busradar-Fahrt-Haltestellen konnten nach Sequenzwechsel nicht aktualisiert werden; vorhandenes Haltestellen-Highlight bleibt unverändert.",
                                            error
                                        );
                                    }
                                });
                        }
                    }

                    const tripId = selectedBusradarRouteTripIdRef.current;
                    if (!tripId) {
                        return;
                    }

                    const now = performance.now();
                    if (
                        now - selectedBusradarRouteUpdatedAtRef.current <
                        BUSRADAR_ROUTE_REFRESH_MS
                    ) {
                        return;
                    }

                    selectedBusradarRouteUpdatedAtRef.current = now;
                    renderSelectedRoute(
                        busradarController.getRouteSplit(tripId, vehicle.coordinate)
                    );
                });
        }

        function selectBusradarVehicle(
            vehicle: BusradarSelectedVehicle,
            focusedStopEta?: BusradarSelectionDetails["focusedStopEta"]
        ) {
            selectedBusradarIdRef.current = vehicle.id;
            selectedBusradarRouteTripIdRef.current = undefined;
            selectedBusradarRouteUpdatedAtRef.current = 0;
            selectedBusradarStopSequenceRef.current = getOptionalNumber(vehicle.properties.sequenz);
            focusedStopRef.current = focusedStopEta;
            setSelectedBusradarTripId(vehicle.id);
            setSelectedBusradarLine(vehicle.properties.linientext);
            busradarController.setSelectedVehicleId(vehicle.id);
            subscribeToSelectedBusradarVehicle(vehicle.id);
            autoFollow.start(vehicle.id);
            const requestId = ++busradarSelectionRequestIdRef.current;
            busradarSelectionAbortControllerRef.current?.abort();
            const abortController = new AbortController();
            busradarSelectionAbortControllerRef.current = abortController;
            const initialDetails: BusradarSelectionDetails = {
                vehicle,
                routeStatus: "loading",
                stopsStatus: "loading",
                focusedStopEta
            };
            renderSelectedRoute(undefined);
            renderBusradarOverlay(vehicle.coordinate, withNextStop(vehicle, initialDetails));

            const fahrtbezeichner = vehicle.properties.fahrtbezeichner;
            if (!fahrtbezeichner) {
                renderBusradarOverlay(vehicle.coordinate, {
                    ...initialDetails,
                    routeStatus: "unavailable",
                    stopsStatus: "unavailable"
                });
                return;
            }

            void busradarController
                .getTripRoute(fahrtbezeichner)
                .then((route) => {
                    if (
                        abortController.signal.aborted ||
                        busradarSelectionRequestIdRef.current !== requestId
                    ) {
                        return;
                    }

                    const currentVehicle = busradarController.getVehicleById(vehicle.id) ?? vehicle;
                    const routeSplit = route
                        ? busradarController.getRouteSplit(
                              fahrtbezeichner,
                              currentVehicle.coordinate
                          )
                        : undefined;
                    selectedBusradarRouteTripIdRef.current = route ? fahrtbezeichner : undefined;
                    selectedBusradarRouteUpdatedAtRef.current = performance.now();
                    renderSelectedRoute(routeSplit);

                    let currentRouteDetails: BusradarSelectionDetails = {
                        ...initialDetails,
                        vehicle: currentVehicle,
                        routeStatus: route ? "available" : "unavailable",
                        routeSplit,
                        stopsStatus: "loading"
                    };
                    renderBusradarOverlay(currentVehicle.coordinate, currentRouteDetails);

                    const fallbackStartStopId = getOptionalString(
                        route?.properties.starthst ?? currentVehicle.properties.starthst
                    );
                    const fallbackEndStopId = getOptionalString(
                        route?.properties.zielhst ?? currentVehicle.properties.zielhst
                    );
                    const fallbackStopIds = [fallbackStartStopId, fallbackEndStopId].filter(
                        isDefinedString
                    );
                    if (fallbackStopIds.length) {
                        void resolveBusradarStopNames(fallbackStopIds, abortController.signal)
                            .then((stopNames) => {
                                if (
                                    abortController.signal.aborted ||
                                    busradarSelectionRequestIdRef.current !== requestId
                                ) {
                                    return;
                                }

                                const startStopName = fallbackStartStopId
                                    ? stopNames.get(fallbackStartStopId)
                                    : undefined;
                                const endStopName = fallbackEndStopId
                                    ? stopNames.get(fallbackEndStopId)
                                    : undefined;
                                if (!startStopName && !endStopName) {
                                    return;
                                }

                                currentRouteDetails = {
                                    ...currentRouteDetails,
                                    startStopName:
                                        currentRouteDetails.startStopName ?? startStopName,
                                    endStopName: currentRouteDetails.endStopName ?? endStopName,
                                    stopsStatus:
                                        currentRouteDetails.stopsStatus === "available"
                                            ? "available"
                                            : "partial"
                                };
                                const latestVehicle =
                                    busradarController.getVehicleById(vehicle.id) ?? vehicle;
                                currentRouteDetails = {
                                    ...currentRouteDetails,
                                    vehicle: latestVehicle
                                };
                                renderBusradarOverlay(
                                    latestVehicle.coordinate,
                                    currentRouteDetails
                                );
                            })
                            .catch((error) => {
                                if ((error as Error).name !== "AbortError") {
                                    console.error(
                                        "Busradar-Haltestellennamen konnten nicht geladen werden.",
                                        error
                                    );
                                }
                            });
                    }

                    const fplId = route?.properties.fpl_id;
                    if (!fplId) {
                        currentRouteDetails = {
                            ...currentRouteDetails,
                            stopsStatus: "unavailable"
                        };
                        renderBusradarOverlay(currentVehicle.coordinate, currentRouteDetails);
                        return;
                    }

                    void loadBusradarTripStops(
                        {
                            fahrtbezeichner,
                            fplId,
                            currentSequence: getOptionalNumber(currentVehicle.properties.sequenz)
                        },
                        abortController.signal
                    )
                        .then((tripStops) => {
                            if (
                                abortController.signal.aborted ||
                                busradarSelectionRequestIdRef.current !== requestId
                            ) {
                                return;
                            }

                            const latestVehicle =
                                busradarController.getVehicleById(vehicle.id) ?? vehicle;
                            selectedBusradarStopSequenceRef.current = getOptionalNumber(
                                latestVehicle.properties.sequenz
                            );
                            const startStopName =
                                tripStops.startStopName ?? currentRouteDetails.startStopName;
                            const endStopName =
                                tripStops.endStopName ?? currentRouteDetails.endStopName;
                            currentRouteDetails = {
                                ...currentRouteDetails,
                                vehicle: latestVehicle,
                                tripStops,
                                startStopName,
                                endStopName,
                                stopsStatus: deriveStopsStatus({
                                    hasStaticStopSequence: tripStops.hasStaticStopSequence,
                                    startStopName,
                                    endStopName
                                })
                            };
                            applyTransitStopRouteHighlightForMap(
                                tripStops.allStopIds,
                                tripStops.stops.find((stop) => stop.isNext)?.stopId
                            );
                            renderBusradarOverlay(
                                latestVehicle.coordinate,
                                withNextStop(latestVehicle, currentRouteDetails)
                            );
                        })
                        .catch((error) => {
                            if (
                                (error as Error).name !== "AbortError" &&
                                busradarSelectionRequestIdRef.current === requestId
                            ) {
                                console.warn(
                                    "Busradar-Fahrt-Haltestellen konnten nicht geladen werden; vorhandenes Haltestellen-Highlight bleibt unverändert.",
                                    error
                                );
                                const latestVehicle =
                                    busradarController.getVehicleById(vehicle.id) ?? vehicle;
                                const fallbackStatus = deriveStopsStatus({
                                    hasStaticStopSequence: false,
                                    startStopName: currentRouteDetails.startStopName,
                                    endStopName: currentRouteDetails.endStopName
                                });
                                renderBusradarOverlay(latestVehicle.coordinate, {
                                    ...currentRouteDetails,
                                    stopsStatus: fallbackStatus
                                });
                            }
                        });
                })
                .catch(() => {
                    if (
                        !abortController.signal.aborted &&
                        busradarSelectionRequestIdRef.current === requestId
                    ) {
                        const latestVehicle =
                            busradarController.getVehicleById(vehicle.id) ?? vehicle;
                        renderBusradarOverlay(latestVehicle.coordinate, {
                            ...initialDetails,
                            routeStatus: "unavailable",
                            stopsStatus: "unavailable"
                        });
                    }
                });
        }

        function selectBusradarVehicleById(
            tripId: string | undefined,
            focusedStopEta?: BusradarSelectionDetails["focusedStopEta"]
        ): BusradarDepartureSelectionStatus {
            if (!tripId) {
                return "unmapped";
            }
            const vehicle = busradarController.getVehicleById(tripId);
            if (!vehicle) {
                return "not-live";
            }
            const activeLineFilter = busradarController.getLineFilter();
            if (
                activeLineFilter.length > 0 &&
                !lineMatchesBusradarFilter(vehicle.properties.linientext, activeLineFilter)
            ) {
                return "filtered";
            }

            // Gleiche Auswahl: nicht abwählen, nur die neu geklickte Abfahrt als priorisierte
            // Zielhaltestelle übernehmen (nextStop wird daraus neu berechnet).
            if (selectedBusradarIdRef.current === vehicle.id) {
                focusedStopRef.current = focusedStopEta;
                const currentDetails = selectedBusradarDetailsRef.current;
                const latestVehicle = busradarController.getVehicleById(vehicle.id) ?? vehicle;
                if (currentDetails) {
                    renderBusradarOverlay(
                        latestVehicle.coordinate,
                        withNextStop(latestVehicle, {
                            ...currentDetails,
                            vehicle: latestVehicle,
                            focusedStopEta
                        })
                    );
                }
                return "selected";
            }

            selectBusradarVehicle(vehicle, focusedStopEta);
            return "selected";
        }

        selectBusradarVehicleByIdRef.current = selectBusradarVehicleById;

        const clickKey: EventsKey = activeMap.olMap.on("singleclick", (event) => {
            // Im Umkreissuche-Modus ist der Klick exklusiv für diese Suche; keine Busauswahl.
            if (nearestStopsActiveRef.current) {
                return;
            }

            let selectedFeature: FeatureLike | undefined;
            activeMap.olMap.forEachFeatureAtPixel(
                event.pixel,
                (feature, layer) => {
                    if (layer === busradarOlLayer) {
                        selectedFeature = feature;
                        return true;
                    }
                    return undefined;
                },
                { hitTolerance: 8 }
            );

            if (!selectedFeature) {
                if (transitStopsOlLayer) {
                    const clickedTransitStop = activeMap.olMap.hasFeatureAtPixel(event.pixel, {
                        layerFilter: (layer) => layer === transitStopsOlLayer,
                        hitTolerance: 8
                    });
                    if (clickedTransitStop) {
                        return;
                    }
                }

                closeBusradarInfo();
                return;
            }

            const vehicle = busradarController.getSelectedVehicle(selectedFeature);
            if (!vehicle) {
                return;
            }

            if (selectedBusradarIdRef.current === vehicle.id) {
                closeBusradarInfo();
                return;
            }

            selectBusradarVehicle(vehicle);
        });

        return () => {
            unsubscribeAvailableLines();
            unByKey(clickKey);
            unByKey(manualMoveKeys);
            unByKey(debugUpdateKeys);
            window.removeEventListener("resize", handleTrackingDebugUpdate);
            trackingDebug.remove();
            mapViewport.removeEventListener("wheel", handleAutoFollowInterrupt);
            closeBusradarInfo();
            if (busradarControllerRef.current === busradarController) {
                busradarControllerRef.current = undefined;
            }
            if (busradarRouteLayerRef.current === routeOlLayer) {
                busradarRouteLayerRef.current = undefined;
            }
            if (busradarInfoOverlayControllerRef.current === infoOverlay) {
                busradarInfoOverlayControllerRef.current = undefined;
            }
            if (busradarAutoFollowControllerRef.current === autoFollow) {
                busradarAutoFollowControllerRef.current = undefined;
            }
            if (busradarClearSelectionRef.current) {
                busradarClearSelectionRef.current = undefined;
            }
            if (selectBusradarVehicleByIdRef.current) {
                selectBusradarVehicleByIdRef.current = undefined;
            }
        };
        // The effect owns transient map listeners and overlays and fills the registered route
        // layer's source. Re-running it on every render would close the active bus selection
        // unexpectedly.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    return {
        busradarAvailableLines,
        busradarSelectedLines,
        selectedBusradarTripId,
        selectedBusradarLine,
        addBusradarLineFilter,
        removeBusradarLineFilter,
        resetBusradarLineFilter
    };
}
