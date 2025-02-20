// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
export interface CssProp {
    // css expression to retrieve the value, i.e. var(..:)
    ref: string;

    // css property name (i.e. --...)
    definition: string;
}

export function createCssProp(name: string): CssProp {
    return {
        definition: `--${name}`,
        ref: `var(--${name})`
    };
}

export const PADDING_LEFT = createCssProp("map-padding-left");
export const PADDING_RIGHT = createCssProp("map-padding-right");
export const PADDING_TOP = createCssProp("map-padding-top");
export const PADDING_BOTTOM = createCssProp("map-padding-bottom");
