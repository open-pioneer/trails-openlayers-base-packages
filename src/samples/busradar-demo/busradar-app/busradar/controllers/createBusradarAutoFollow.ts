// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { type MapModel } from "@open-pioneer/map";
import type { BusradarSelectedVehicle } from "../../map/layers/busradarLayer";
import {
    clampPixelToRect,
    isMapPixel,
    isPixelInsideRect,
    type BusradarTrackingBoxes
} from "../../utils/busradarTracking";

const BUS_TRACKING_CHECK_MS = 500;
const BUS_TRACKING_USER_INTERACTION_PAUSE_MS = 1_000;
const BUS_TRACKING_INITIAL_CENTER_ANIMATION_MS = 450;
const BUS_TRACKING_PAN_ANIMATION_MS = 450;

/** Imperativer Controller für das Auto-Follow/Tracking der ausgewählten Busfahrt. */
export interface BusradarAutoFollowController {
    /** Zentriert initial auf das Fahrzeug und startet das periodische Nachführen. */
    start(vehicleId: string): void;
    /** Stoppt Nachführen und laufende Animationen und setzt den Pausen-/Animationszustand zurück. */
    stop(): void;
    /** Pausiert das Nachführen kurz nach einer Nutzerbewegung (nur wenn gerade nicht animiert). */
    pauseAfterUserInteraction(): void;
    /** Unterbricht das Nachführen sofort und pausiert es kurz (bricht laufende Animation ab). */
    interruptAfterUserInteraction(): void;
}

/**
 * Kapselt das Auto-Follow-Verhalten der Busauswahl: initiale Zentrierung, periodisches Nachführen
 * innerhalb der Tracking-Box und das Pausieren/Unterbrechen nach Nutzerinteraktion.
 *
 * Der interne Animations-/Pausenzustand lebt für die Lebensdauer des Controllers (eine
 * Effect-Ausführung). Selektion, Fahrzeugdaten und Tracking-Boxen werden als Callbacks
 * hereingereicht, damit dieser Controller keine Selektions- oder Overlay-Details kennt.
 */
export function createBusradarAutoFollow(options: {
    map: MapModel;
    getSelectedVehicleId: () => string | undefined;
    getVehicleById: (id: string) => BusradarSelectedVehicle | undefined;
    getTrackingBoxes: (mapSize: [number, number]) => BusradarTrackingBoxes | undefined;
}): BusradarAutoFollowController {
    const { map, getSelectedVehicleId, getVehicleById, getTrackingBoxes } = options;
    let followInterval: ReturnType<typeof setInterval> | undefined;
    let pausedUntil = 0;
    let isAnimating = false;

    function stop() {
        if (followInterval) {
            clearInterval(followInterval);
            followInterval = undefined;
        }
        if (isAnimating) {
            map.olView.cancelAnimations();
        }
        pausedUntil = 0;
        isAnimating = false;
    }

    function start(vehicleId: string) {
        stop();
        const vehicle = getVehicleById(vehicleId);
        if (!vehicle) {
            return;
        }

        isAnimating = true;
        map.olView.animate(
            {
                center: vehicle.coordinate,
                duration: BUS_TRACKING_INITIAL_CENTER_ANIMATION_MS
            },
            () => {
                isAnimating = false;
                if (getSelectedVehicleId() !== vehicleId || followInterval) {
                    return;
                }

                followInterval = setInterval(() => {
                    follow(vehicleId);
                }, BUS_TRACKING_CHECK_MS);
                follow(vehicleId);
            }
        );
    }

    function follow(vehicleId: string) {
        if (getSelectedVehicleId() !== vehicleId) {
            stop();
            return;
        }

        if (performance.now() < pausedUntil) {
            return;
        }

        if (isAnimating) {
            return;
        }

        const vehicle = getVehicleById(vehicleId);
        const mapSize = map.olMap.getSize();
        const currentCenter = map.olView.getCenter();
        if (!vehicle || !isMapPixel(mapSize) || !currentCenter) {
            return;
        }

        const vehiclePixel = map.olMap.getPixelFromCoordinate(vehicle.coordinate);
        const centerPixel = map.olMap.getPixelFromCoordinate(currentCenter);
        if (!isMapPixel(vehiclePixel) || !isMapPixel(centerPixel)) {
            return;
        }

        const trackingBoxes = getTrackingBoxes(mapSize);
        if (!trackingBoxes || isPixelInsideRect(vehiclePixel, trackingBoxes.outer)) {
            return;
        }

        const targetPixel = clampPixelToRect(vehiclePixel, trackingBoxes.inner);
        const nextCenter = map.olMap.getCoordinateFromPixel([
            centerPixel[0] + vehiclePixel[0] - targetPixel[0],
            centerPixel[1] + vehiclePixel[1] - targetPixel[1]
        ]);
        if (!nextCenter) {
            return;
        }

        isAnimating = true;
        map.olView.animate({ center: nextCenter, duration: BUS_TRACKING_PAN_ANIMATION_MS }, () => {
            isAnimating = false;
        });
    }

    function pauseAfterUserInteraction() {
        if (isAnimating) {
            return;
        }

        pausedUntil = performance.now() + BUS_TRACKING_USER_INTERACTION_PAUSE_MS;
    }

    function interruptAfterUserInteraction() {
        pausedUntil = performance.now() + BUS_TRACKING_USER_INTERACTION_PAUSE_MS;

        if (isAnimating) {
            map.olView.cancelAnimations();
            isAnimating = false;
        }
    }

    return { start, stop, pauseAfterUserInteraction, interruptAfterUserInteraction };
}
