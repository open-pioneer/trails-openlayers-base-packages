// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { DeclaredService } from "@open-pioneer/runtime";
import OlMap from "ol/Map";

export interface PrintingService extends DeclaredService<"printing.PrintingService"> {
    /**
     * Starts a map print operation on the specified map.
     *
     * The promise resolves with the resulting map image or with any error that occurred
     * while printing the map.
     */
    printMap(
        olMap: OlMap,
        blockUserInteraction?: boolean,
        overlayText?: string
    ): Promise<PrintResult>;
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
    getPNGDataURL(quality?: number, canvas?: HTMLCanvasElement): string;
}

export { Printing, type PrintingProps } from "./Printing";
