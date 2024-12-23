// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Props as RndProps } from "react-rnd";

export function toRndFrame(windowFrame: WindowFrame): RndFrame {
    return {
        x: Math.max(
            0, windowFrame.left ?? window.innerWidth - windowFrame.right - windowFrame.width
        ),
        y: Math.max(
            0, windowFrame.top ?? window.innerHeight - windowFrame.bottom - windowFrame.height
        ),
        width: windowFrame.width ?? window.innerWidth - windowFrame.left - windowFrame.right,
        height: windowFrame.height ?? window.innerHeight - windowFrame.top - windowFrame.bottom
    };
}

export function isRndFrame(value: unknown): value is RndFrame {
    return isObject(value) && RND_FRAME_KEYS.every((key) => typeof value[key] === "number");
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

// Make sure the window frame does not exceed the web page boundaries.
export function normalize(frame: RndFrame): RndFrame {
    const width = Math.min(frame.width, window.innerWidth);
    const height = Math.min(frame.height, window.innerHeight);

    return {
        x: frame.x - Math.max(0, frame.x + width - window.innerWidth),
        y: frame.y - Math.max(0, frame.y + height - window.innerHeight),
        width,
        height
    };
}

const RND_FRAME_KEYS: (keyof RndFrame)[] = ["x", "y", "width", "height"];

export type WindowFrame = Horizontal & Vertical;

type Horizontal = Xor<Value<"left" | "width">, Value<"right" | "width">, Value<"left" | "right">>;
type Vertical = Xor<Value<"top" | "height">, Value<"bottom" | "height">, Value<"top" | "bottom">>;

type Value<K extends string> = {
    readonly [L in K]: number
};

type Xor<T, U, V> = (T & Without<T, U | V>) | (U & Without<U, T | V>) | (V & Without<V, T | U>);

type Without<T, U> = {
    readonly [K in Exclude<keyof U, keyof T>]?: never;
};

export type RndFrame = NonNullableReadonlyNumeric<RndProps["default"]>;

type NonNullableReadonlyNumeric<T> = {
    readonly [K in keyof NonNullable<T>]: number;
};
