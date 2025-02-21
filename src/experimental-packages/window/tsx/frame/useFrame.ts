// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from "react";

import { toRndFrame, type RndFrame, type WindowFrame } from "./frame";
import { useFrameSavers, type FrameSavers } from "./useFrameSavers";
import { useLocalStorageFrame } from "./useLocalStorageFrame";

export function useFrame(identifier: string | undefined, windowFrame: WindowFrame): FrameObject {
    const [localStorageFrame, setLocalStorageFrame] = useLocalStorageFrame(identifier);

    const initialFrame = useMemo(() => {
        return localStorageFrame ?? toRndFrame(windowFrame);
    }, [localStorageFrame, windowFrame]);

    const frameSavers = useFrameSavers(initialFrame, setLocalStorageFrame);

    return useMemo(() => ({ initialFrame, ...frameSavers }), [initialFrame, frameSavers]);
}

interface FrameObject extends FrameSavers {
    readonly initialFrame: RndFrame;
}
