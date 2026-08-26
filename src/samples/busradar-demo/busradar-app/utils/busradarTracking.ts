// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/**
 * Reine Geometrie- und Pixel-Helfer für das Auto-Follow-/Tracking-Verhalten der Busradar-Auswahl.
 *
 * Bewusst frei von Map-, OpenLayers- und DOM-Abhängigkeiten, damit die Tracking-Mathematik
 * (nutzbarer Bereich, äußere/innere Box, Pixel-Checks) isoliert unit-testbar bleibt. Die
 * Konstanten liegen hier, weil sie ausschließlich von diesem Modul verwendet werden.
 */

/** Rechteck in Viewport-Pixeln (Ursprung oben links). */
export type PixelRect = { left: number; top: number; right: number; bottom: number };

/** Äußere/innere Tracking-Box plus nutzbarer Bereich für das Auto-Follow. */
export type BusradarTrackingBoxes = {
    usable: PixelRect;
    outer: PixelRect;
    inner: PixelRect;
};

/** Eingaben, die den nutzbaren Bereich beeinflussen (Panel-Zustand, Overlay-Höhe). */
export type BusradarUsableRectInput = {
    leftPanelActive: boolean;
    overlayHeight: number;
};

const BUS_TRACKING_BOX_WIDTH_RATIO = 0.95;
const BUS_TRACKING_BOX_HEIGHT_RATIO = 0.95;
const BUS_TRACKING_TARGET_BOX_WIDTH_RATIO = 0.15;
const BUS_TRACKING_TARGET_BOX_HEIGHT_RATIO = 0.15;
const BUS_TRACKING_TOP_PADDING_PX = 50;
const BUS_TRACKING_RIGHT_PADDING_PX = 96;
const BUS_TRACKING_BOTTOM_PADDING_PX = 80;
const BUS_TRACKING_LEFT_PADDING_PX = 32;
const BUS_TRACKING_PANEL_LEFT_PADDING_PX = 336;
const BUS_TRACKING_POPOVER_GAP_PX = 40;

/** Prüft, ob ein Wert ein gültiges `[x, y]`-Pixel-/Größen-Tupel ist. */
export function isMapPixel(value: unknown): value is [number, number] {
    return (
        Array.isArray(value) &&
        value.length === 2 &&
        typeof value[0] === "number" &&
        typeof value[1] === "number"
    );
}

/** Prüft, ob ein Pixel innerhalb (inklusive Rand) eines Rechtecks liegt. */
export function isPixelInsideRect(pixel: [number, number], rect: PixelRect) {
    return (
        pixel[0] >= rect.left &&
        pixel[0] <= rect.right &&
        pixel[1] >= rect.top &&
        pixel[1] <= rect.bottom
    );
}

/** Begrenzt ein Pixel auf die Grenzen eines Rechtecks. */
export function clampPixelToRect(pixel: [number, number], rect: PixelRect): [number, number] {
    return [clamp(pixel[0], rect.left, rect.right), clamp(pixel[1], rect.top, rect.bottom)];
}

/** Begrenzt einen Wert auf das Intervall `[min, max]`. */
export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

/** Erzeugt ein zentriert im Rechteck liegendes Unterrechteck mit den gegebenen Seitenverhältnissen. */
export function getCenteredRatioRect(
    rect: PixelRect,
    widthRatio: number,
    heightRatio: number
): PixelRect {
    const width = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    const boxWidth = width * widthRatio;
    const boxHeight = height * heightRatio;
    const centerX = rect.left + width / 2;
    const centerY = rect.top + height / 2;

    return {
        left: centerX - boxWidth / 2,
        top: centerY - boxHeight / 2,
        right: centerX + boxWidth / 2,
        bottom: centerY + boxHeight / 2
    };
}

/**
 * Berechnet den nutzbaren Kartenbereich in Pixeln. Ein aktives linkes Panel und die Höhe des
 * Info-Overlays verkleinern den Bereich, damit der verfolgte Bus nicht hinter Panel/Popup gerät.
 */
export function getBusradarUsableRect(
    mapSize: [number, number],
    { leftPanelActive, overlayHeight }: BusradarUsableRectInput
): PixelRect {
    const left = leftPanelActive
        ? BUS_TRACKING_PANEL_LEFT_PADDING_PX
        : BUS_TRACKING_LEFT_PADDING_PX;
    const top = Math.max(BUS_TRACKING_TOP_PADDING_PX, overlayHeight + BUS_TRACKING_POPOVER_GAP_PX);

    return {
        left,
        top,
        right: Math.max(left, mapSize[0] - BUS_TRACKING_RIGHT_PADDING_PX),
        bottom: Math.max(top, mapSize[1] - BUS_TRACKING_BOTTOM_PADDING_PX)
    };
}

/**
 * Berechnet nutzbaren Bereich, äußere Tracking-Box und innere Target-Box. Gibt `undefined`
 * zurück, wenn der nutzbare Bereich degeneriert ist (kein Platz zum Verfolgen).
 */
export function getBusradarTrackingBoxes(
    mapSize: [number, number],
    input: BusradarUsableRectInput
): BusradarTrackingBoxes | undefined {
    const usableRect = getBusradarUsableRect(mapSize, input);
    if (usableRect.right <= usableRect.left || usableRect.bottom <= usableRect.top) {
        return undefined;
    }

    return {
        usable: usableRect,
        outer: getCenteredRatioRect(
            usableRect,
            BUS_TRACKING_BOX_WIDTH_RATIO,
            BUS_TRACKING_BOX_HEIGHT_RATIO
        ),
        inner: getCenteredRatioRect(
            usableRect,
            BUS_TRACKING_TARGET_BOX_WIDTH_RATIO,
            BUS_TRACKING_TARGET_BOX_HEIGHT_RATIO
        )
    };
}
