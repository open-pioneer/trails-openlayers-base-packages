// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { type MapModel } from "@open-pioneer/map";
import {
    isMapPixel,
    type BusradarTrackingBoxes,
    type PixelRect
} from "../../utils/busradarTracking";

// Entwickler-Diagnosewerkzeug: zeichnet nutzbaren Bereich, Tracking- und Target-Box als DOM-Overlay
// über den Viewport. Standardmäßig aus; zum Diagnostizieren manuell auf `true` setzen.
const BUS_TRACKING_DEBUG_VISIBLE = false;
const BUS_TRACKING_DEBUG_UPDATE_MS = 250;

type DebugBoxKind = "usable" | "outer" | "inner";

/** Imperativer Controller für das flag-gesteuerte Tracking-Debug-Overlay. */
export interface BusradarTrackingDebugController {
    /** Startet das periodische Debug-Update (No-op, wenn das Debug-Flag aus ist). */
    start(): void;
    /** Aktualisiert das Debug-Overlay anhand der aktuellen Kartengröße. */
    update(): void;
    /** Entfernt Intervall und Overlay. */
    remove(): void;
}

/**
 * Kapselt das Entwickler-Debug-Overlay der Bus-Verfolgung (nutzbarer Bereich, äußere/innere Box).
 *
 * Vollständig durch `BUS_TRACKING_DEBUG_VISIBLE` gesteuert und standardmäßig inaktiv. Hält
 * Intervall und DOM-Overlay intern; die Auswahl-Logik ruft nur `start`/`update`/`remove`.
 */
export function createBusradarTrackingDebug(options: {
    map: MapModel;
    getTrackingBoxes: (mapSize: [number, number]) => BusradarTrackingBoxes | undefined;
}): BusradarTrackingDebugController {
    const { map, getTrackingBoxes } = options;
    let interval: ReturnType<typeof setInterval> | undefined;
    let overlayElement: HTMLDivElement | undefined;

    function ensureOverlay() {
        if (overlayElement) {
            return overlayElement;
        }

        const overlay = document.createElement("div");
        overlay.className = "basis-opt-app__bus-tracking-debug";
        overlay.append(
            createDebugBox("usable", "Nutzbarer Bereich"),
            createDebugBox("outer", "Tracking Box"),
            createDebugBox("inner", "Target Box")
        );
        map.olMap.getViewport().append(overlay);
        overlayElement = overlay;
        return overlay;
    }

    function remove() {
        if (interval) {
            clearInterval(interval);
            interval = undefined;
        }
        overlayElement?.remove();
        overlayElement = undefined;
    }

    function update() {
        if (!BUS_TRACKING_DEBUG_VISIBLE) {
            remove();
            return;
        }

        const mapSize = map.olMap.getSize();
        if (!isMapPixel(mapSize)) {
            return;
        }

        const trackingBoxes = getTrackingBoxes(mapSize);
        const overlay = ensureOverlay();
        if (!trackingBoxes || !overlay) {
            overlay?.classList.add("basis-opt-app__bus-tracking-debug--hidden");
            return;
        }

        overlay.classList.remove("basis-opt-app__bus-tracking-debug--hidden");
        setDebugRect(overlay, "usable", trackingBoxes.usable);
        setDebugRect(overlay, "outer", trackingBoxes.outer);
        setDebugRect(overlay, "inner", trackingBoxes.inner);
    }

    function start() {
        if (!BUS_TRACKING_DEBUG_VISIBLE) {
            remove();
            return;
        }

        update();
        interval = setInterval(update, BUS_TRACKING_DEBUG_UPDATE_MS);
    }

    return { start, update, remove };
}

function createDebugBox(kind: DebugBoxKind, label: string) {
    const box = document.createElement("div");
    box.className = `basis-opt-app__bus-tracking-debug-box basis-opt-app__bus-tracking-debug-box--${kind}`;

    const labelElement = document.createElement("span");
    labelElement.className = "basis-opt-app__bus-tracking-debug-label";
    labelElement.textContent = label;
    box.append(labelElement);
    return box;
}

function setDebugRect(overlay: HTMLElement, kind: DebugBoxKind, rect: PixelRect) {
    const box = overlay.querySelector<HTMLElement>(
        `.basis-opt-app__bus-tracking-debug-box--${kind}`
    );
    if (!box) {
        return;
    }

    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.width = `${Math.max(0, rect.right - rect.left)}px`;
    box.style.height = `${Math.max(0, rect.bottom - rect.top)}px`;
}
