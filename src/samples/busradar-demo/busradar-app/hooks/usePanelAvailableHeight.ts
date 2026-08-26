// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState, type RefObject } from "react";

/**
 * Misst die verfügbare Höhe innerhalb des Kartencontainers für ein MapAnchor-Panel.
 *
 * Statt auf den Browser-Viewport (`vh`) zu binden, wird der `.map-anchors`-Host des Panels
 * (`position:absolute`, an das Map-Padding inset gesetzt, also mit definierter Höhe des
 * Karten-/WebComponent-Containers) per `ResizeObserver` beobachtet. Zurückgegeben wird die
 * Höhe abzüglich 20px – identisch zum MapAnchor-Cap `calc(100% - 20px)` (attributionGap 0 +
 * 2×verticalGap bei gesetztem `verticalGap`). Dadurch bleibt ein vergrößertes Panel exakt
 * innerhalb des Containers und kann intern scrollen, statt am `overflow:hidden` geclippt zu werden.
 *
 * Nur aktiv, wenn `active` true ist; andernfalls wird der Beobachter getrennt und `undefined`
 * geliefert (kompakter Standardzustand bleibt unverändert).
 */
export function usePanelAvailableHeight(
    ref: RefObject<HTMLElement | null>,
    active: boolean
): number | undefined {
    const [availableHeight, setAvailableHeight] = useState<number>();

    useEffect(() => {
        if (!active) {
            setAvailableHeight(undefined);
            return;
        }
        const host = ref.current?.closest<HTMLElement>(".map-anchors");
        if (!host) {
            return;
        }

        // 20px = MapAnchor-Cap calc(100% - 20px) (oberer verticalGap 10px + unterer Abstand 10px).
        const update = () => setAvailableHeight(Math.max(0, host.clientHeight - 20));
        update();

        const observer = new ResizeObserver(update);
        observer.observe(host);
        return () => observer.disconnect();
    }, [ref, active]);

    return availableHeight;
}
