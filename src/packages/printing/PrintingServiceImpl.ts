// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { PrintingOptions, PrintingService, PrintResult, ViewPaddingBehavior } from "./index";
import OlMap from "ol/Map";
import Draw from "ol/interaction/Draw";
import { StyleLike } from "ol/style/Style";
import { ScaleLine } from "ol/control";
import { Interaction } from "ol/interaction";
import { createManualPromise, Resource } from "@open-pioneer/core";
import { Options } from "html2canvas";
import { canvasToPng, createBlockUserOverlay, PRINTING_HIDE_CLASS } from "./utils";
import { ServiceOptions } from "@open-pioneer/runtime";

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
            ...options
        });
        return await job.printMap();
    }
}

interface ViewPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

// Exported just for test (mocking)
export class PrintJob {
    private olMap: OlMap;
    private blockUserInteraction: boolean = false;
    private overlayText: string;
    private viewPadding: ViewPaddingBehavior;

    private running = false;
    private drawInformation: { draw: Draw; style: StyleLike | null | undefined }[] | undefined = [];
    private scaleLine: ScaleLine | undefined = undefined;
    private overlay: Resource | undefined = undefined;

    constructor(olMap: OlMap, options: Required<PrintingOptions>) {
        this.olMap = olMap;
        this.blockUserInteraction = options.blockUserInteraction;
        this.overlayText = options.overlayText;
        this.viewPadding = options.viewPadding;
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
                canvas = this.removePadding(canvas, this.getViewPadding());
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
        await this.addScaleLine();
    }

    private async addScaleLine() {
        const scaleLine = (this.scaleLine = new ScaleLine({
            className: "printing-scale-bar ol-scale-bar",
            bar: true,
            text: true,
            minWidth: 125
        }));

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
            const { bottom: paddingBottom, left: paddingLeft } = this.getViewPadding();
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

        const oldRender = this.scaleLine.render;
        this.scaleLine.render = (...args) => {
            oldRender.apply(this.scaleLine, args);
            renderPromise.resolve();
        };
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

        // Lazy load html2canvas: it is a large dependency (a few hundred KiB) that is only
        // required when actually printed. This speeds up the initial page load.
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(element, exportOptions);
        return canvas;
    }

    private reset() {
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
        // The canvas returned by html2canvas is scaled by the device pixel ratio.
        // The padding needs to be adjusted (because its in css pixels).
        const dpr = window.devicePixelRatio || 1;
        const dprPadding = {
            top: rawPadding.top * dpr,
            right: rawPadding.right * dpr,
            bottom: rawPadding.bottom * dpr,
            left: rawPadding.left * dpr
        };

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

    private getViewPadding(): ViewPadding {
        const map = this.olMap;
        // top, right, bottom, left
        const rawPadding = (map.getView().padding ?? [0, 0, 0, 0]) as [
            number,
            number,
            number,
            number
        ];
        return {
            top: rawPadding[0] ?? 0,
            right: rawPadding[1] ?? 0,
            bottom: rawPadding[2] ?? 0,
            left: rawPadding[3] ?? 0
        };
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
