// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createManualPromise, Resource } from "@open-pioneer/core";
import { ServiceOptions } from "@open-pioneer/runtime";
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
import { getPointResolution } from "ol/proj";

const MM_PER_INCH = 25.4;
const INCHES_PER_METER = 39.37;

export class PrintingServiceImpl implements PrintingService {
    private defaultOverlayText: string;

    constructor(options: ServiceOptions) {
        this.defaultOverlayText = options.intl.formatMessage({
            id: "printingMap"
        });
    }

    async printMap(olMap: OlMap, options?: PrintingOptions): Promise<PrintResultImpl> {
        const job = new PrintJob(olMap, {
            blockUserInteraction: true,
            overlayText: this.defaultOverlayText,
            viewPadding: "auto",
            resolution: undefined,
            scale: undefined,
            height: undefined,
            width: undefined,
            ...options
        });
        return await job.printMap();
    }
}

interface DrawInfo {
    draw: Draw;
    style: StyleLike | FlatStyleLike | null | undefined;
}

// Exported just for test (mocking)
export class PrintJob {
    private olMap: OlMap;
    private blockUserInteraction: boolean = false;
    private overlayText: string;
    private viewPadding: ViewPaddingBehavior;
    private resolution: number | undefined = undefined;
    private scale: number | undefined = undefined;
    private height: number | undefined = undefined;
    private width: number | undefined = undefined;

    private running = false;
    private drawInformation: DrawInfo[] | undefined = [];
    private scaleLine: ScaleLine | undefined = undefined;
    private overlay: Resource | undefined = undefined;
    private viewResolution: number;
    private scaleResolution: number | undefined = undefined;

    constructor(olMap: OlMap, options: Required<PrintingOptions>) {
        this.olMap = olMap;
        this.blockUserInteraction = options.blockUserInteraction;
        this.overlayText = options.overlayText;
        this.viewPadding = options.viewPadding;

        // save current state of map
        const viewResolution = this.olMap.getView().getResolution();
        if (!viewResolution) {
            throw new Error("Cannot get current map resolution");
        }
        this.viewResolution = viewResolution;

        // if no params for target image specified, export current map canvas
        if (options.scale && options.resolution && options.width && options.height) {
            this.scale = options.scale;
            this.resolution = options.resolution;

            const padding = getViewPadding(this.olMap);
            this.width =
                Math.round((options.width * this.resolution) / MM_PER_INCH) +
                padding.left +
                padding.right;
            this.height =
                Math.round((options.height * this.resolution) / MM_PER_INCH) +
                padding.top +
                padding.bottom;

            const center = this.olMap.getView().getCenter();
            if (!center) {
                throw Error("Cannot get current map center");
            }
            const projection = this.olMap.getView().getProjection();
            const mpu = projection.getMetersPerUnit() ?? 1;
            const resolution = this.resolution * INCHES_PER_METER * mpu; // pixels per meter
            this.scaleResolution = this.scale / getPointResolution(projection, resolution, center);
        }
    }

    async printMap(): Promise<PrintResultImpl> {
        if (this.running) {
            throw new Error("Printing already running.");
        }

        try {
            await this.beginExport();

            let canvas = await this.printToCanvas(this.olMap.getViewport());
            if (!canvas) {
                throw new Error("Canvas export failed");
            }

            if (this.viewPadding === "auto") {
                canvas = this.removePadding(canvas, getViewPadding(this.olMap));
            }
            return new PrintResultImpl(canvas);
        } finally {
            // Always remove scale bar
            this.reset();
        }
    }

    private async beginExport() {
        this.running = true;

        /** hides active draw interactions while printing (set feature style to null ) */
        const interactions = this.olMap
            .getInteractions()
            .getArray()
            .filter((interaction: Interaction) => {
                return interaction.getActive() && interaction instanceof Draw;
            });
        this.drawInformation = [];
        interactions?.forEach((interaction) => {
            const draw = interaction as Draw;
            const previousStyle = draw.getOverlay().getStyle();
            draw.getOverlay().setStyle(null);
            this.drawInformation?.push({
                draw: draw,
                style: previousStyle
            });
        });

        if (this.blockUserInteraction) {
            const container = this.olMap?.getTargetElement();
            if (container) {
                this.overlay = createBlockUserOverlay(container, this.overlayText);
            }
        }

        // set print size if specified
        if (this.width && this.height && this.scaleResolution) {
            this.olMap.getTargetElement().style.width = this.width + "px";
            this.olMap.getTargetElement().style.height = this.height + "px";
            this.olMap.updateSize();
            this.olMap.getView().setResolution(this.scaleResolution);
        }

        await this.addScaleLine();
    }

    private async addScaleLine() {
        const scaleLine = (this.scaleLine = new ScaleLine({
            className: "printing-scale-bar ol-scale-bar",
            bar: true,
            text: true,
            minWidth: 125
        }));
        if (this.resolution) {
            this.scaleLine.setDpi(this.resolution);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scaleLineElement = (scaleLine as any).element as HTMLElement;
        if (!scaleLineElement) {
            throw new Error("Scale line does not have an element");
        }

        // Position the scale bar manually.
        // The 50px should be plenty to avoid overlapping with open layers attributions on most cases.
        // Additionally, take the view padding into account (if behavior is 'auto').
        let bottom = 50;
        let left = 8;
        if (this.viewPadding === "auto") {
            const { bottom: paddingBottom, left: paddingLeft } = getViewPadding(this.olMap);
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

        this.olMap.once("rendercomplete", () => {
            renderPromise.resolve();
            clearTimeout(timeout);
        });

        this.olMap?.addControl(this.scaleLine);

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

        if (this.width && this.height) {
            exportOptions.width = this.width;
            exportOptions.height = this.height;
        }

        // Lazy load html2canvas: it is a large dependency (a few hundred KiB) that is only
        // required when actually printed. This speeds up the initial page load.
        const html2canvas = (await import("html2canvas")).default;

        return await html2canvas(element, exportOptions);
    }

    private reset() {
        // reset original map size
        this.olMap.getTargetElement().style.width = "";
        this.olMap.getTargetElement().style.height = "";
        this.olMap.updateSize();
        this.olMap.getView().setResolution(this.viewResolution);

        if (this.scaleLine) {
            this.olMap?.removeControl(this.scaleLine);
            this.scaleLine = undefined;
        }
        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = undefined;
        }

        this.running = false;

        /** show active draw interactions after printing (reset feature style to its previous style ) */
        this.drawInformation?.length &&
            this.drawInformation.forEach((drawInfo) => {
                drawInfo.draw.getOverlay().setStyle(drawInfo.style);
            });
    }

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
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }
    getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    getPNGDataURL(quality?: number): string {
        return canvasToPng(this.canvas, quality);
    }
}
