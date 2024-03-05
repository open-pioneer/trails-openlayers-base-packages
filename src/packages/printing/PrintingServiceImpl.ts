// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import type { PrintingService, PrintResult } from "./index";
import OlMap from "ol/Map";
import Draw from "ol/interaction/Draw";
import { StyleLike } from "ol/style/Style";
import { ScaleLine } from "ol/control";
import { Interaction } from "ol/interaction";
import { createManualPromise } from "@open-pioneer/core";
import { Options } from "html2canvas";

const PRINTING_HIDE_CLASS = "printing-hide";
const IMAGE_QUALITY = 0.8;
export class PrintingServiceImpl implements PrintingService {
    private olMap: OlMap | undefined;
    private running = false;

    private drawInformation: { draw: Draw; style: StyleLike | null | undefined }[] | undefined = [];

    private scaleLine: ScaleLine | undefined = undefined;

    private blockUserInteraction: boolean = false;

    async printMap(olMap: OlMap, blockUserInteraction: boolean): Promise<PrintResultImpl> {
        this.olMap = olMap;
        this.blockUserInteraction = blockUserInteraction;

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
            ?.getInteractions()
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

        this.blockUserInteraction && this.addOverlay();
        await this.addScaleLine();
    }

    private addOverlay() {
        const container = this.olMap?.getTargetElement();
        const overlay = document.createElement("div");
        overlay.classList.add("printing-overlay", PRINTING_HIDE_CLASS);
        container?.appendChild(overlay);

        const message = document.createElement("div");
        message.classList.add("printing-overlay-status");
        message.textContent = "Karte wird gedruckt ..."; //todo: use i18n overlayText;
        overlay.appendChild(message);
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

    getPNGDataURL(quality?: number, customCanvas?: HTMLCanvasElement): string {
        const imageQuality = quality || IMAGE_QUALITY;

        //customized canvas can be provided (adjusting size, adding style or content can be done separately)
        const canvasToPrint = customCanvas || this.canvas;
        if (!canvasToPrint) {
            throw new Error("Canvas export failed");
        }

        return canvasToPrint.toDataURL("image/png", imageQuality);
    }
}
