// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Resource } from "@open-pioneer/core";
import type OlView from "ol/View";

const DEFAULT_QUALITY = 0.8;

export type PageSizeType = "a3" | "a4" | "a5";
export type PageOrientationType = "landscape" | "portrait";

// long: longer side of the page
// lengths in millimeters
const PAGE_SIZE: { [format: string]: { short: number; long: number } } = {
    a3: { short: 297, long: 420 },
    a4: { short: 210, long: 297 },
    a5: { short: 148, long: 210 }
};

export interface PageDimension {
    height: number;
    width: number;
}

export interface ViewPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export const PRINTING_HIDE_CLASS = "printing-hide";

export function canvasToPng(canvas: HTMLCanvasElement, quality?: number) {
    return canvas.toDataURL("image/png", quality ?? DEFAULT_QUALITY);
}

export function createBlockUserOverlay(container: HTMLElement, text: string): Resource {
    const overlay = document.createElement("div");
    overlay.classList.add("printing-overlay", PRINTING_HIDE_CLASS);
    container.appendChild(overlay);

    const message = document.createElement("div");
    message.classList.add("printing-overlay-status");
    message.textContent = text;
    overlay.appendChild(message);

    return {
        destroy() {
            overlay.remove();
        }
    };
}

export function getPageDimensions(
    size: PageSizeType,
    orientation: PageOrientationType
): PageDimension {
    const pageSize = PAGE_SIZE[size];
    if (!pageSize) {
        throw new Error("Page Size ${size} is not defined");
    }

    const short = pageSize.short;
    const long = pageSize.long;

    const width = orientation === "landscape" ? long : short;
    const height = orientation === "landscape" ? short : long;

    return { height, width };
}

export function scalePadding(rawPadding: ViewPadding): ViewPadding {
    // The canvas returned by html2canvas is scaled by the device pixel ratio.
    // The padding needs to be adjusted (because its in css pixels).
    const dpr = window.devicePixelRatio || 1;

    return {
        top: rawPadding.top * dpr,
        right: rawPadding.right * dpr,
        bottom: rawPadding.bottom * dpr,
        left: rawPadding.left * dpr
    };
}

export function getViewPadding(olView: OlView): ViewPadding {
    // top, right, bottom, left
    const rawPadding = (olView.padding ?? [0, 0, 0, 0]) as [number, number, number, number];
    return {
        top: rawPadding[0] ?? 0,
        right: rawPadding[1] ?? 0,
        bottom: rawPadding[2] ?? 0,
        left: rawPadding[3] ?? 0
    };
}
