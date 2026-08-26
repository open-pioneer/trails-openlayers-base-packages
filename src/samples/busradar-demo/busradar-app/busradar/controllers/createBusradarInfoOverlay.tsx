// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { type MapModel, type Overlay } from "@open-pioneer/map";
import { BusradarInfoOverlay } from "../../components/BusradarInfoOverlay";
import type { BusradarSelectionDetails } from "../../types";

/** Imperativer Controller für das Busradar-Info-Popup (`map.overlays`). */
export interface BusradarInfoOverlayController {
    /** Erzeugt das Overlay oder aktualisiert Position und Inhalt. */
    render(coordinate: number[], details: BusradarSelectionDetails, error?: string): void;
    /** Verschiebt nur die Overlay-Position (ohne Inhalt neu zu rendern). */
    setPosition(coordinate: number[]): void;
    /** Aktuelle DOM-Höhe des Overlay-Elements in Pixeln (0, wenn nicht vorhanden). */
    getElementHeight(): number;
    /** Zerstört das Overlay, falls vorhanden; der Controller bleibt weiterverwendbar. */
    destroy(): void;
}

/**
 * Kapselt Lebenszyklus und Aktualisierung des Busradar-Info-Overlays.
 *
 * Hält die OL-`Overlay`-Instanz intern, damit die Auswahl-Logik nur noch fachliche Aufrufe
 * (render/setPosition/destroy) macht. Das Setzen von Auswahl-Details bleibt bewusst beim
 * Aufrufer; dieser Controller ist ausschließlich für das Overlay zuständig.
 */
export function createBusradarInfoOverlay(options: {
    map: MapModel;
    onClose: () => void;
}): BusradarInfoOverlayController {
    const { map, onClose } = options;
    let overlay: Overlay | undefined;

    return {
        render(coordinate, details, error) {
            const content = (
                <BusradarInfoOverlay details={details} error={error} onClose={onClose} />
            );

            if (overlay) {
                overlay.setPosition(coordinate);
                overlay.setContent(content);
            } else {
                overlay = map.overlays.add({
                    tag: "busradar-info",
                    content,
                    position: coordinate,
                    positioning: "bottom-center",
                    offset: [0, -18],
                    className: "basis-opt-app__busradar-popup-overlay",
                    ariaRole: "dialog"
                });
            }
        },
        setPosition(coordinate) {
            overlay?.setPosition(coordinate);
        },
        getElementHeight() {
            const element = overlay?.olOverlay.getElement();
            return element?.getBoundingClientRect().height ?? 0;
        },
        destroy() {
            overlay?.destroy();
            overlay = undefined;
        }
    };
}
