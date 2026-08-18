// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { ReadonlyReactive } from "@conterra/reactivity-core";
import { createManualPromise, Resource } from "@open-pioneer/core";
import { DEFAULT_DPI, MapModel } from "@open-pioneer/map";
import { PackageIntl, ServiceOptions } from "@open-pioneer/runtime";
import { Options } from "html2canvas";
import { ScaleLine } from "ol/control";
import { Interaction } from "ol/interaction";
import Draw from "ol/interaction/Draw";
import OlMap from "ol/Map";
import { FlatStyleLike } from "ol/style/flat";
import { StyleLike } from "ol/style/Style";
import type { PrintingOptions, PrintingService, PrintResult, ViewPaddingBehavior } from "./index";
import {
    canvasToPng,
    createBlockUserOverlay,
    getViewPadding,
    PRINTING_HIDE_CLASS,
    scalePadding,
    ViewPadding
} from "./utils";

const MM_PER_INCH = 25.4;

export class PrintingServiceImpl implements PrintingService {
    #intl: ReadonlyReactive<PackageIntl>;

    constructor(options: ServiceOptions) {
        this.#intl = options.currentIntl;
    }

    async printMap(
        mapParam: MapModel | OlMap,
        options?: PrintingOptions
    ): Promise<PrintResultImpl> {
        // Basic property detection to discriminate between olmap / mapmodel, this is done to preserve backwards compatibility for
        // callers that only pass an OlMap.
        let map: MapModel | undefined;
        let olMap: OlMap;
        if ("getViewResolutionForScale" in mapParam) {
            map = mapParam;
            olMap = map.olMap;
        } else {
            olMap = mapParam;
        }

        const job = new PrintJob(map, olMap, {
            blockUserInteraction: true,
            overlayText: this.#intl.value.formatMessage({ id: "printingMap" }),
            viewPadding: "auto",
            dpi: DEFAULT_DPI,
            ...options
        });
        return await job.printMap();
    }
}

interface DrawInfo {
    draw: Draw;
    style: StyleLike | FlatStyleLike | null | undefined;
}

// some options such as scale do not have hardcoded defaults; their defaults are computed on demand only.
type PrintJobOptions = PrintingOptions &
    Required<Omit<PrintingOptions, "scale" | "height" | "width">>;

// Exported just for test (mocking)
export class PrintJob {
    #map: MapModel | undefined;
    #olMap: OlMap;
    #blockUserInteraction: boolean = false;
    #overlayText: string;
    #viewPadding: ViewPaddingBehavior;
    #resolution: number | undefined = undefined;
    #height: number | undefined = undefined; // Pixels!
    #width: number | undefined = undefined; // Pixels!

    #running = false;
    #drawInformation: DrawInfo[] | undefined = [];
    #scaleLine: ScaleLine | undefined = undefined;
    #overlay: Resource | undefined = undefined;
    #viewResolution: number;
    #viewHeight: string;
    #viewWidth: string;
    #scaleResolution: number | undefined = undefined;

    // NOTE: Map is optional here to support the legacy "OlMap-only" API.
    constructor(map: MapModel | undefined, olMap: OlMap, options: PrintJobOptions) {
        this.#map = map;
        this.#olMap = olMap;
        this.#blockUserInteraction = options.blockUserInteraction;
        this.#overlayText = options.overlayText;
        this.#viewPadding = options.viewPadding;

        // save current state of map
        const viewResolution = olMap.getView().getResolution();
        if (viewResolution == null) {
            throw new Error("Cannot get current map resolution");
        }
        this.#viewResolution = viewResolution;
        this.#viewHeight = this.#olMap.getTargetElement().style.height;
        this.#viewWidth = this.#olMap.getTargetElement().style.width;

        // if no params for target image specified, export current map canvas
        const padding = getViewPadding(olMap.getView());
        this.#width = options.width
            ? Math.round((options.width * options.dpi) / MM_PER_INCH) + padding.left + padding.right
            : this.#olMap.getTargetElement().offsetWidth;
        this.#height = options.height
            ? Math.round((options.height * options.dpi) / MM_PER_INCH) +
              padding.top +
              padding.bottom
            : this.#olMap.getTargetElement().offsetHeight;
        this.#scaleResolution =
            options.scale != null && this.#map
                ? this.#map.getViewResolutionForScale(options.scale, options.dpi)
                : this.#olMap.getView().getResolution();
        this.#resolution = options.dpi ? options.dpi : DEFAULT_DPI;
    }

    async printMap(): Promise<PrintResultImpl> {
        if (this.#running) {
            throw new Error("Printing already running.");
        }

        try {
            await this.#beginExport();

            let canvas = await this.printToCanvas(this.#olMap.getViewport());
            if (!canvas) {
                throw new Error("Canvas export failed");
            }

            if (this.#viewPadding === "auto") {
                canvas = this.removePadding(canvas, getViewPadding(this.#olMap.getView()));
            }
            return new PrintResultImpl(canvas);
        } finally {
            // Always remove scale bar
            this.#reset();
        }
    }

    async #beginExport() {
        this.#running = true;

        /** hides active draw interactions while printing (set feature style to null ) */
        const interactions = this.#olMap
            .getInteractions()
            .getArray()
            .filter((interaction: Interaction) => {
                return interaction.getActive() && interaction instanceof Draw;
            });
        this.#drawInformation = [];
        interactions?.forEach((interaction) => {
            const draw = interaction as Draw;
            const previousStyle = draw.getOverlay().getStyle();
            draw.getOverlay().setStyle(null);
            this.#drawInformation?.push({
                draw: draw,
                style: previousStyle
            });
        });

        if (this.#blockUserInteraction) {
            const container = this.#olMap?.getTargetElement();
            if (container) {
                this.#overlay = createBlockUserOverlay(container, this.#overlayText);
            }
        }

        // set print size if specified
        this.#olMap.getTargetElement().style.width = this.#width + "px";
        this.#olMap.getTargetElement().style.height = this.#height + "px";
        this.#olMap.updateSize();
        this.#olMap.getView().setResolution(this.#scaleResolution);

        await this.#addScaleLine();
    }

    async #addScaleLine() {
        const scaleLine = (this.#scaleLine = new ScaleLine({
            className: "printing-scale-bar ol-scale-bar",
            bar: true,
            text: true,
            minWidth: 125
        }));
        this.#scaleLine.setDpi(this.#resolution);

        // oxlint-disable-next-line @typescript-eslint/no-explicit-any
        const scaleLineElement = (scaleLine as any).element as HTMLElement;
        if (!scaleLineElement) {
            throw new Error("Scale line does not have an element");
        }

        // Position the scale bar manually.
        // The 50px should be plenty to avoid overlapping with open layers attributions on most cases.
        // Additionally, take the view padding into account (if behavior is 'auto').
        let bottom = 50;
        let left = 8;
        if (this.#viewPadding === "auto") {
            const { bottom: paddingBottom, left: paddingLeft } = getViewPadding(
                this.#olMap.getView()
            );
            bottom = Math.max(paddingBottom + 8, bottom);
            left += paddingLeft;
        }
        scaleLineElement.style.setProperty("--printing-scale-bar-bottom", `${bottom}px`);
        scaleLineElement.style.setProperty("--printing-scale-bar-left", `${left}px`);

        const renderPromise = createManualPromise<void>();

        // We expect the scale line to be rendered by the open layers map.
        // This is a sanity check that throws an error when that either doesn't happen
        // or if it takes an extremely large time.
        const timeout = setTimeout(() => {
            renderPromise.reject(new Error("Scale line did not render"));
        }, 3000);

        this.#olMap.once("rendercomplete", () => {
            renderPromise.resolve();
            clearTimeout(timeout);
        });

        this.#olMap?.addControl(this.#scaleLine);

        try {
            // Wait until render (+ one additional frame just to be sure).
            await renderPromise.promise;
            await new Promise((resolve) => {
                requestAnimationFrame(resolve);
            });
        } finally {
            clearTimeout(timeout);
        }
    }

    // Kept as a TypeScript `private` method (not a `#` private) so tests can replace it via
    // `vi.spyOn(PrintJob.prototype, ...)`: real canvas rendering does not work under jsdom.
    private async printToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
        // export options for html2canvas.
        const exportOptions: Partial<Options> = {
            useCORS: true,
            ignoreElements: function (element: Element) {
                if (element.classList && typeof element.classList === "object") {
                    const classList = element.classList;
                    return (
                        classList.contains("map-anchors") || classList.contains(PRINTING_HIDE_CLASS)
                    );
                }
                return false;
            }
        };

        exportOptions.width = this.#width;
        exportOptions.height = this.#height;

        // Lazy load html2canvas: it is a large dependency (a few hundred KiB) that is only
        // required when actually printed. This speeds up the initial page load.
        const html2canvas = (await import("html2canvas")).default;

        return await html2canvas(element, exportOptions);
    }

    #reset() {
        // reset original map size
        this.#olMap.getTargetElement().style.width = this.#viewWidth;
        this.#olMap.getTargetElement().style.height = this.#viewHeight;
        this.#olMap.updateSize();
        this.#olMap.getView().setResolution(this.#viewResolution);

        if (this.#scaleLine) {
            this.#olMap?.removeControl(this.#scaleLine);
            this.#scaleLine = undefined;
        }
        if (this.#overlay) {
            this.#overlay.destroy();
            this.#overlay = undefined;
        }

        this.#running = false;

        /** show active draw interactions after printing (reset feature style to its previous style ) */
        this.#drawInformation?.length &&
            this.#drawInformation.forEach((drawInfo) => {
                drawInfo.draw.getOverlay().setStyle(drawInfo.style);
            });
    }

    // Kept as a TypeScript `private` method (not a `#` private) so tests can replace it via
    // `vi.spyOn(PrintJob.prototype, ...)`: `canvas.getContext()` is unavailable under jsdom.
    private removePadding(canvas: HTMLCanvasElement, rawPadding: ViewPadding): HTMLCanvasElement {
        const dprPadding = scalePadding(rawPadding);

        if (
            dprPadding.left === 0 &&
            dprPadding.right === 0 &&
            dprPadding.top === 0 &&
            dprPadding.bottom === 0
        ) {
            return canvas;
        }

        const { width, height } = canvas;
        const newCanvas = document.createElement("canvas");
        newCanvas.width = width - dprPadding.left - dprPadding.right;
        newCanvas.height = height - dprPadding.top - dprPadding.bottom;

        const newCtx = newCanvas.getContext("2d");
        if (!newCtx) {
            throw new Error("Failed to get a canvas context");
        }

        newCtx.drawImage(
            canvas,
            dprPadding.left,
            dprPadding.top,
            newCanvas.width,
            newCanvas.height,
            0,
            0,
            newCanvas.width,
            newCanvas.height
        );
        return newCanvas;
    }
}

class PrintResultImpl implements PrintResult {
    #canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
    }
    getCanvas(): HTMLCanvasElement {
        return this.#canvas;
    }

    getPNGDataURL(quality?: number): string {
        return canvasToPng(this.#canvas, quality);
    }
}
