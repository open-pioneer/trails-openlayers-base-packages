// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { DeclaredService } from "@open-pioneer/runtime";
import OlMap from "ol/Map";

/**
 * Options supported when printing the map.
 */
export interface PrintingOptions {
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
 * Whether to respect the map view's padding when printing.
 *
 * - `"auto"`: Respect the map's current viewPadding.
 *   Padded regions of the map will _not_ be included in the print result.
 * - `"ignore"`: Ignore the map's viewPadding. The entire map will be printed.
 */
export type ViewPaddingBehavior = "auto" | "ignore";

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
     */
    printMap(olMap: OlMap, options?: PrintingOptions): Promise<PrintResult>;
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
