// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Resource } from "@open-pioneer/core";
import { getScaleForPointResolution, MapModel } from "@open-pioneer/map";
import type OlView from "ol/View";
import { PageOrientationType, PageFormatType } from "./index";
import type OlMap from "ol/Map";

const DEFAULT_QUALITY = 0.8;

interface PageFormat {
    short: number; // millimeters
    long: number; // millimeters
}

const PAGE_FORMAT: Record<PageFormatType, PageFormat> = {
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
    // set to map size before printing to ensure overlay message is centered
    overlay.style.width = container.offsetWidth + "px";
    overlay.style.height = container.offsetHeight + "px";
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

export function getPageSize(format: PageFormatType, orientation: PageOrientationType): PageSize {
    const { short, long } = PAGE_FORMAT[format];
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

export function getMapCenterPixel(olMap: OlMap): number[] | undefined {
    const mapSize = olMap.getSize();
    if (!mapSize || !mapSize[0] || !mapSize[1]) return;

    const padding = getViewPadding(olMap.getView());

    const x = (mapSize[0] + padding.left - padding.right) / 2;
    const y = (mapSize[1] + padding.top - padding.bottom) / 2;

    return [x, y];
}

export function drawPrintArea(context: CanvasRenderingContext2D, printArea: number[]) {
    context.reset();

    context.save();

    context.beginPath();

    // outside polygon, clockwise
    const outer = [0, 0, context.canvas.width, context.canvas.height];
    drawRectangle(context, outer);

    // inner polygon, counter-clockwise
    drawRectangle(context, printArea, true);

    context.closePath();

    context.fillStyle = "rgba(0, 5, 25, 0.70)";
    context.fill();

    context.restore();
}

export function drawRectangle(
    context: CanvasRenderingContext2D,
    pixelExtent: number[],
    reverse: boolean = false
) {
    const [minX, minY, maxX, maxY] = pixelExtent;
    if (minX == null || minY == null || maxX == null || maxY == null) return;

    // start in top left edge
    context.moveTo(minX, minY);

    const points = [
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY]
    ];
    if (reverse) points.reverse(); // anti-clockwise drawing

    for (const point of points) {
        if (point[0] == null || point[1] == null) return;
        context.lineTo(point[0], point[1]);
    }
}

export function getPixelBounds(map: MapModel, pageFormat: PageFormatType, orientation: PageOrientationType, scale: number): number[] | undefined {
    const pageSize = getPageSize(pageFormat, orientation);
    const screenSize = getScreenSizeForPageSize(map, pageSize, scale);
    if (!screenSize) return;

    const centerPixel = getMapCenterPixel(map.olMap);
    if (!centerPixel || !centerPixel[0] || !centerPixel[1]) return;

    const { pixelHeight, pixelWidth } = screenSize;
    const minX = centerPixel[0] - pixelWidth / 2;
    const minY = centerPixel[1] - pixelHeight / 2;
    const maxX = centerPixel[0] + pixelWidth / 2;
    const maxY = centerPixel[1] + pixelHeight / 2;

    return [minX, minY, maxX, maxY];
}

/**
 * Returns the size of a page on screen in pixels.
 *
 * `pageSize` is the size of a paper page in millimeters.
 * `scale` is the scale denominator of the printed map.
 * `targetDpi` is the screen pixel density in _pixels per inch_ if not {@link DEFAULT_DPI}.
 */
export function getScreenSizeForPageSize(
    map: MapModel,
    pageSize: PageSize,
    scale: number,
    targetDpi?: number
): ScreenSize | undefined {
    const centerPointResolution = map.getCenterPointResolution(); // meters in real world per pixel
    if (!centerPointResolution) return;

    const sc = targetDpi
        ? getScaleForPointResolution({ pointResolution: centerPointResolution, dpi: targetDpi })
        : scale;

    const realWidth = (pageSize.paperWidth * sc) / 1000.0; // meters in real world
    const realHeight = (pageSize.paperHeight * sc) / 1000.0;

    const pixelWidth = Math.round(realWidth / centerPointResolution); // pixels on screen
    const pixelHeight = Math.round(realHeight / centerPointResolution);

    return { pixelWidth, pixelHeight };
}
