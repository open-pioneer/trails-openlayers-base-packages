// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from "react";
import { isRndFrame, normalize, type RndFrame } from "./frame";

export function useLocalStorageFrame(identifier: string | undefined): LocalStorageFrameState {
    return useMemo(
        () => [getFrame(identifier), (frame) => setFrame(identifier, frame)],
        [identifier]
    );
}

function getFrame(identifier: string | undefined): RndFrame | undefined {
    try {
        if (identifier != null) {
            const key = getLocalStorageKey(identifier);
            const item = localStorage.getItem(key);
            if (item != null) {
                const frame = JSON.parse(item);
                if (isRndFrame(frame)) {
                    return normalize(frame);
                }
            }
        }
        return undefined;
    } catch {
        return undefined;
    }
}

function setFrame(identifier: string | undefined, frame: RndFrame): void {
    try {
        if (identifier != null) {
            const key = getLocalStorageKey(identifier);
            const item = JSON.stringify(frame);
            localStorage.setItem(key, item);
        }
    } catch {
        /* ignore */
    }
}

function getLocalStorageKey(identifier: string): string {
    return `${LOCAL_STORAGE_KEY_PREFIX}-${identifier}`;
}

const LOCAL_STORAGE_KEY_PREFIX = "window-frame";

type LocalStorageFrameState = [RndFrame | undefined, (frame: RndFrame) => void];
