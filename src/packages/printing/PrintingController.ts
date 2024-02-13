// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createManualPromise } from "@open-pioneer/core";
import type { Options } from "html2canvas";
import OlMap from "ol/Map";
import { ScaleLine } from "ol/control";
import { Interaction } from "ol/interaction";
import Draw from "ol/interaction/Draw";

export type FileFormatType = "png" | "pdf";

const DEFAULT_FILE_NAME = "map";

const PRINTING_HIDE_CLASS = "printing-hide";

export class PrintingController {
    private olMap: OlMap;
    private title: string = "";
    private fileFormat: FileFormatType = "pdf";
    private running = false;
    private i18n: I18n;

    private drawInteractions: Interaction[] | undefined = [];

    private scaleLine: ScaleLine | undefined = undefined;

    private overlay: HTMLDivElement | undefined = undefined;

    constructor(olMap: OlMap, i18n: I18n) {
        this.olMap = olMap;
        this.i18n = i18n;
    }

    destroy() {
        this.reset();
    }

    setTitle(title: string) {
        this.title = title;
    }

    setFileFormat(format: FileFormatType) {
        this.fileFormat = format;
    }

    async handleMapExport() {
        if (!this.olMap || !this.fileFormat) {
            return;
        }

        if (this.running) {
            throw new Error("Printing already running.");
        }

        try {
            await this.beginExport();

            // export options for html2canvas.
            const exportOptions: Partial<Options> = {
                useCORS: true,
                ignoreElements: function (element: Element) {
                    if (element.classList && typeof element.classList === "object") {
                        const classList = element.classList;
                        return (
                            classList.contains("map-anchors") ||
                            classList.contains(PRINTING_HIDE_CLASS)
                        );
                    }
                    return false;
                }
            };

            // Lazy load html2canvas: it is a large dependency (>= KiB) that is only
            // required when actually printed. This speeds up the initial page load.
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(this.olMap.getViewport(), exportOptions);
            if (canvas) {
                this.fileFormat == "png"
                    ? await this.exportMapInPNG(canvas)
                    : await this.exportMapInPDF(canvas);
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

        /** hides active draw interactions while printing */
        this.drawInteractions = this.olMap
            .getInteractions()
            .getArray()
            .filter((interaction: Interaction) => {
                return interaction.getActive() && interaction instanceof Draw;
            });
        this.drawInteractions?.forEach((interaction) => {
            interaction.setActive(false);
        });

        this.addOverlay();
        await this.addScaleLine();
    }

    private reset() {
        this.removeScaleLine();
        this.removeOverlay();
        this.running = false;

        /** show active draw interactions after printing */
        this.drawInteractions?.length &&
            this.drawInteractions.forEach((interaction) => interaction.setActive(true));
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
        this.olMap.addControl(this.scaleLine);

        // Wait until render (+ one additional frame just to be sure).
        await renderPromise.promise;
        await new Promise((resolve) => {
            requestAnimationFrame(resolve);
        });
    }

    private removeScaleLine() {
        if (this.scaleLine) {
            this.olMap.removeControl(this.scaleLine);
            this.scaleLine = undefined;
        }
    }

    private addOverlay() {
        const container = this.olMap.getTargetElement();
        const overlay = (this.overlay = document.createElement("div"));
        overlay.classList.add("printing-overlay", PRINTING_HIDE_CLASS);
        container.appendChild(overlay);

        const message = document.createElement("div");
        message.classList.add("printing-overlay-status");
        message.textContent = this.i18n.overlayText;
        overlay.appendChild(message);
    }

    private removeOverlay() {
        this.overlay?.remove();
        this.overlay = undefined;
    }

    private getTitleAndFileName() {
        const titleValue = this.title || "";
        const fileName = this.title || DEFAULT_FILE_NAME;
        return { title: titleValue, fileName: fileName };
    }

    private async exportMapInPNG(mapCanvas: HTMLCanvasElement) {
        const containerCanvas = document.createElement("canvas");
        containerCanvas.width = mapCanvas.width;
        containerCanvas.height = mapCanvas.height + 50;
        containerCanvas.style.backgroundColor = "#fff";

        const context = containerCanvas.getContext("2d");
        if (!context) {
            throw new Error("2d canvas rendering context not available");
        }

        const { title, fileName } = this.getTitleAndFileName();

        context.fillStyle = "#fff"; // background color for background rect
        context.fillRect(0, 0, containerCanvas.width, containerCanvas.height); //draw background rect
        context.font = 20 + "px bold sans-serif";
        context.textAlign = "center";
        context.fillStyle = "#000"; // text color

        const x = containerCanvas.width / 2; //align text to center
        context.fillText(title, x, 20);
        context.drawImage(mapCanvas, 0, 50);

        const link = document.createElement("a");
        link.setAttribute("download", fileName + ".png");
        link.href = containerCanvas.toDataURL("image/png", 0.8);
        link.click();
    }

    private async exportMapInPDF(canvas: HTMLCanvasElement) {
        // Landscape map export.
        // Lazy load pdfjs as well.
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });

        // Simple layout: 50 pixels for the header and
        // the remaining space can be used by the map export.
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const titleOffset = 15;
        const mapOffset = 20;
        const mapPageHeight = pageHeight - mapOffset;

        // Render title
        pdf.setFontSize(20);
        const { title, fileName } = this.getTitleAndFileName();
        pdf.text(title, pageWidth / 2, titleOffset, { align: "center" });

        // Resize image while keeping aspect ratio
        const imageAspectRatio = canvas.width / canvas.height;
        let targetImageHeight = mapPageHeight;
        let targetImageWidth = targetImageHeight * imageAspectRatio;
        if (targetImageWidth >= pageWidth) {
            targetImageWidth = pageWidth;
            targetImageHeight = targetImageWidth / imageAspectRatio;
        }

        // Center image
        const imageX = (pageWidth - targetImageWidth) / 2;
        const imageY = mapOffset + (mapPageHeight - targetImageHeight) / 2;

        pdf.addImage(canvas, "", imageX, imageY, targetImageWidth, targetImageHeight);
        pdf.save(fileName + ".pdf");
    }
}

interface I18n {
    overlayText: string;
}
