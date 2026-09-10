// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";

/**
 * Liefert die aktuelle Zeit in Sekunden als React-State, der in einem festen Intervall aktualisiert
 * wird. Dadurch bleibt der Render rein (kein direkter `Date.now()`-Aufruf während des Renderns),
 * während zeitabhängige Ableitungen – etwa das Ausblenden vergangener Abfahrten – regelmäßig
 * nachziehen.
 */
export function useNowSeconds(updateIntervalMs = 30_000): number {
    const [nowSeconds, setNowSeconds] = useState(0);

    useEffect(() => {
        setNowSeconds(Date.now() / 1000);
        const intervalId = window.setInterval(
            () => setNowSeconds(Date.now() / 1000),
            updateIntervalMs
        );
        return () => window.clearInterval(intervalId);
    }, [updateIntervalMs]);

    return nowSeconds;
}
