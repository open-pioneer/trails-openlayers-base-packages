// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { type MapModel } from "@open-pioneer/map";
import { useEffect, type RefObject } from "react";
import {
    getSelectedTransitStopsVectorLayer,
    getTransitStopsVectorLayer
} from "../map/layers/layerAccess";
import {
    applyTransitStopThemeColors,
    type TransitStopThemeColors
} from "../map/layers/transitStopsLayer";

/**
 * Setzt die Haltestellenmarker-Farben aus den aufgelösten Trails-/Chakra-Theme-Tokens.
 *
 * OpenLayers kann `var(--chakra-...)` nicht direkt verwenden, deshalb werden die Farben
 * innerhalb des `.basis-opt-app`-Scopes per `getComputedStyle` aufgelöst und als konkrete
 * Farbwerte an den Layer übergeben. Bei Theme-Wechsel (light/dark auf `.pioneer-root`)
 * werden die Farben erneut angewendet.
 */
export function useTransitStopThemeColors(
    map: MapModel | undefined,
    scopeRef: RefObject<HTMLDivElement | null>
) {
    useEffect(() => {
        if (!map) {
            return;
        }

        const scopeElement = scopeRef.current;
        if (!scopeElement) {
            return;
        }

        function applyThemeColors() {
            const scope = scopeRef.current;
            const transitStopsOlLayer = getTransitStopsVectorLayer(map);
            if (!scope || !transitStopsOlLayer) {
                return;
            }
            const colors = readTransitStopThemeColors(scope);
            if (colors) {
                applyTransitStopThemeColors(transitStopsOlLayer, colors);
                // Der Selected-Stop-Layer nutzt denselben (bereits geleerten) Icon-Cache und
                // dieselbe Farbkonfiguration; ein erneutes Rendern übernimmt die neuen Farben.
                getSelectedTransitStopsVectorLayer(map)?.changed();
            }
        }

        applyThemeColors();

        const colorModeRoot = scopeElement.closest(".pioneer-root");
        if (!colorModeRoot || typeof MutationObserver === "undefined") {
            return;
        }

        const observer = new MutationObserver(applyThemeColors);
        observer.observe(colorModeRoot, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, [map, scopeRef]);
}

/**
 * Löst die Haltestellen-Markerfarben aus den Trails-/Chakra-Theme-Tokens im
 * `.basis-opt-app`-Scope auf. Die Aliase liegen auf `.basis-opt-app` und lösen zu
 * konkreten Hex-Werten auf, die OpenLayers direkt als Fill/Stroke verwenden kann.
 *
 * Fehlt ein Token, wird der Wert weggelassen (statt still eine falsche Farbe zu
 * setzen); der Layer behält dann seinen dokumentierten technischen Fallback und es
 * wird eine Warnung ausgegeben.
 */
function readTransitStopThemeColors(
    scope: HTMLElement
): Partial<TransitStopThemeColors> | undefined {
    const styles = getComputedStyle(scope);
    const read = (property: string, tokenLabel: string): string | undefined => {
        const value = styles.getPropertyValue(property).trim();
        if (!value) {
            console.warn(
                `[basis-opt-app] Theme-Token ${tokenLabel} (${property}) konnte nicht aufgelöst werden; verwende dokumentierten Fallback für Haltestellenmarker.`
            );
            return undefined;
        }
        return value;
    };

    const colors: Partial<TransitStopThemeColors> = {};
    const normal = read("--basis-opt-app-accent-fg", "trails.fg");
    if (normal) {
        colors.normal = normal;
    }
    const selected = read("--basis-opt-app-danger", "red.solid");
    if (selected) {
        colors.selected = selected;
    }
    const next = read("--chakra-colors-orange-solid", "orange.solid");
    if (next) {
        colors.next = next;
    }
    const label = read("--basis-opt-app-fg", "fg");
    if (label) {
        colors.label = label;
    }
    const halo = read("--basis-opt-app-accent-contrast", "trails.contrast");
    if (halo) {
        colors.halo = halo;
    }

    return Object.keys(colors).length > 0 ? colors : undefined;
}
