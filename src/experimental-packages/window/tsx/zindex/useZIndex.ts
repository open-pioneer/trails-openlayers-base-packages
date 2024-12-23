// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useEffect, useMemo, useState } from "react";

export function useZIndex(): [number, () => void] {
    const windowId = useMemo(() => getNewId(), []);
    const [zIndex, setZIndex] = useState(0);

    const bringToFront = useCallback(() => {
        const newZIndex = findMaxZIndex(windowId) + 1;
        zIndices.set(windowId, newZIndex);
        setZIndex(newZIndex);
    }, [windowId]);

    useEffect(() => {
        bringToFront();
        return () => void zIndices.delete(windowId);
    }, [bringToFront, windowId]);

    return [zIndex, bringToFront];
}

function getNewId(): string {
    return `window-${Math.random()}`;
}

function findMaxZIndex(windowId: string): number {
    let maximum = 0;
    for (const [id, zIndex] of zIndices.entries()) {
        if (id !== windowId && zIndex > maximum) {
            maximum = zIndex;
        }
    }
    return maximum;
}

const zIndices = new Map<string, number>();
