// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { PrintingOptions, PrintingService, PrintResult } from "./index";
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

    async printMap(olMap: OlMap, options: PrintingOptions): Promise<PrintResultImpl> {
        const job = new PrintJob(olMap, {
            blockUserInteraction: true,
            overlayText: this.defaultOverlayText,
            ...options
        });
        return await job.printMap();
    }
}

// Exported just for test (mocking)
export class PrintJob {
    private olMap: OlMap;
    private blockUserInteraction: boolean = false;
    private overlayText: string;

    private running = false;
    private drawInformation: { draw: Draw; style: StyleLike | null | undefined }[] | undefined = [];
    private scaleLine: ScaleLine | undefined = undefined;
    private overlay: Resource | undefined = undefined;

    constructor(olMap: OlMap, options: Required<PrintingOptions>) {
        this.olMap = olMap;
        this.blockUserInteraction = options.blockUserInteraction;
        this.overlayText = options.overlayText;
    }

    async printMap(): Promise<PrintResultImpl> {
        if (this.running) {
            throw new Error("Printing already running.");
        }

        try {
            await this.beginExport();

            const canvas = await this.printToCanvas(this.olMap.getViewport());
            if (canvas) {
                return new PrintResultImpl(canvas);
            } else {
                throw new Error("Canvas export failed");
            }
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
        this.scaleLine = new ScaleLine({
            className: "printing-scale-bar ol-scale-bar",
            bar: true,
            text: true,
            minWidth: 125
        });
        const renderPromise = createManualPromise<void>();
        const oldRender = this.scaleLine.render;
        this.scaleLine.render = (...args) => {
            oldRender.apply(this.scaleLine, args);
            renderPromise.resolve();
        };
        this.olMap?.addControl(this.scaleLine);

        // Wait until render (+ one additional frame just to be sure).
        await renderPromise.promise;
        await new Promise((resolve) => {
            requestAnimationFrame(resolve);
        });
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

        // Lazy load html2canvas: it is a large dependency (>= KiB) that is only
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
