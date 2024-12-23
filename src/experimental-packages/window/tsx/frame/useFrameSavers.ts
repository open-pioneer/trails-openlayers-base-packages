// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMemo, useRef } from "react";
import type { Props as RndProps } from "react-rnd";
import type { RndFrame } from "./frame";

export function useFrameSavers(
    { width, height }: RndFrame,
    setLocalStorageFrame: (frame: RndFrame) => void
): FrameSavers {
    const size = useRef({ width, height });

    return useMemo(() => ({
        onResizeStop(_, __, { style }, ___, { x, y }) {
            const newSize = {
                width: parseInt(style.width),
                height: parseInt(style.height)
            };
            setLocalStorageFrame({ x, y, ...newSize });
            size.current = newSize;
        },

        onDragStop(_, { x, y }) {
            setLocalStorageFrame({ x, y, ...size.current });
        }
    }), [setLocalStorageFrame]);
}

export type FrameSavers = Pick<RndProps, "onResizeStop" | "onDragStop">;
