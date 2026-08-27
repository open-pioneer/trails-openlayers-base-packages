// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Resource } from "@open-pioneer/core";
import { getScaleForPointResolution, MapModel } from "@open-pioneer/map";
import type OlView from "ol/View";
import { PageOrientationType, PageFormatType } from "./index";

const DEFAULT_QUALITY = 0.8;

interface PageFormat {
    short: number; // millimeters
    long: number; // millimeters
}

const PAGE_SIZE: Record<PageFormatType, PageFormat> = {
    a3: { short: 297, long: 420 },
    a4: { short: 210, long: 297 },
    a5: { short: 148, long: 210 }
};

// height and width of a page in millimeters
export interface PageSize {
    paperHeight: number;
    paperWidth: number;
}

// height and width of a screen extent in pixels
export interface ScreenSize {
    pixelHeight: number;
    pixelWidth: number;
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

export function getPageSize(size: PageFormatType, orientation: PageOrientationType): PageSize {
    const { short, long } = PAGE_SIZE[size];
    const paperWidth = orientation === "landscape" ? long : short;
    const paperHeight = orientation === "landscape" ? short : long;

    return { paperHeight, paperWidth };
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

/**
 * Returns the size of a page on screen in pixels.
 *
 * `pageSize` is the size of a paper page in millimeters.
 * `scale` is the scale denominator of the printed map.
 * `targetDpi` is the screen resolution if not DEFAULT_DPI.
 */
export function getScreenSizeForPageSize(
    map: MapModel,
    pageSize: PageSize,
    scale: number,
    targetDpi?: number
): ScreenSize | undefined {
    const resolution = map.getCenterPointResolution(); // meters in real world per pixel
    if (!resolution) return;

    const sc = targetDpi ? getScaleForPointResolution({pointResolution: resolution, dpi: targetDpi}) : scale;

    const realWidth = (pageSize.paperWidth * sc) / 1000.0; // meters in real world
    const realHeight = (pageSize.paperHeight * sc) / 1000.0;

    const pixelWidth = Math.round(realWidth / resolution); // pixels on screen
    const pixelHeight = Math.round(realHeight / resolution);

    return { pixelWidth, pixelHeight };
}
