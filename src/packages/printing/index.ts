// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { MapModel } from "@open-pioneer/map";
import { DeclaredService } from "@open-pioneer/runtime";
import type OlMap from "ol/Map";

/**
 * These options are supported when printing an `olMap` only (without a map model).
 *
 * They will eventually move into {@link PrintingOptions}.
 *
 * @deprecated
 */
export interface OlMapPrintingOptions {
    /**
     * When this is true (the default), an overlay will be added above the map
     * to block user interactions.
     *
     * It is recommended to block user interaction (in some way) while the map is printing
     * to avoid inconsistencies.
     */
    blockUserInteraction?: boolean;

    /**
     * This option can be used to customize the text content of the overlay (if enabled).
     */
    overlayText?: string;

    /**
     * Whether to respect the map view's padding when printing (default: `"auto"`).
     */
    viewPadding?: ViewPaddingBehavior;
}

/**
 * Options supported when printing the map.
 *
 * These options require a `mapModel` to be passed -- not a raw OlMap.
 */
export interface PrintingOptions extends OlMapPrintingOptions {
    /**
     * The print resolution to be generated in dots per inch (default: current display resolution).
     */
    dpi?: number;

    /**
     * The scale of the generated map (default: current map scale).
     */
    scale?: number;

    /**
     * The vertical size of the generated map in millimeters (default: current map size).
     */
    height?: number;

    /**
     * The horizontal size of the generated map in millimeters (default: current map size).
     */
    width?: number;
}

/**
 * Whether to respect the map view's padding when printing.
 *
 * - `"auto"`: Respect the map's current viewPadding.
 *   Padded regions of the map will _not_ be included in the print result.
 * - `"ignore"`: Ignore the map's viewPadding. The entire map will be printed.
 */
export type ViewPaddingBehavior = "auto" | "ignore";

/**
 * Standard page size formats.
 */
export type PageFormatType = "a3" | "a4" | "a5";

/**
 * Type guard for checking if the value is a {@link PageFormatType}.
 */
export function isPageFormatType(value: string): value is PageFormatType {
    return value === "a3" || value === "a4" || value === "a5";
}

/**
 * Orientation of a page.
 */
export type PageOrientationType = "landscape" | "portrait";

/**
 * Type guard for checking if the value is a {@link PageOrientationType}.
 */
export function isPageOrientationType(value: string): value is PageOrientationType {
    return value === "landscape" || value === "portrait";
}

/**
 * Output file format.
 */
export type FileFormatType = "png" | "pdf";

/**
 * Type guard for checking if the value is a {@link FileFormatType}.
 */
export function isFileFormatType(value: string): value is FileFormatType {
    return value === "png" || value === "pdf";
}

/**
 * The printing service provides an image of a map as a canvas element or a data URL for a PNG image.
 *
 * Inject an instance of this service by referencing the interface name `"printing.PrintingService"`.
 */
export interface PrintingService extends DeclaredService<"printing.PrintingService"> {
    /**
     * Starts a map print operation on the specified map.
     *
     * The promise resolves with the resulting map image or with any error that occurred
     * while printing the map.
     *
     * @deprecated
     */
    printMap(olMap: OlMap, options?: OlMapPrintingOptions): Promise<PrintResult>;

    /**
     * Starts a map print operation on the specified map.
     *
     * The promise resolves with the resulting map image or with any error that occurred
     * while printing the map.
     */
    printMap(map: MapModel, options?: PrintingOptions): Promise<PrintResult>;
}

/** The result of a print operation. */
export interface PrintResult {
    /** Returns a canvas element that contains the result of the map print. */
    getCanvas(): HTMLCanvasElement;

    /**
     * Returns a data URL (i.e. `data:...`) that contains a PNG image.
     *
     * Use `quality` (between 0 and 1, defaults to 0.8) to control the image size / compression.
     *
     * See also <https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL>.
     */
    getPNGDataURL(quality?: number): string;
}

export { Printing, type PrintingProps } from "./Printing";
