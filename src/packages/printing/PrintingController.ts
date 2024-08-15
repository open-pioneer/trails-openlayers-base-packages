// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import OlMap from "ol/Map";
import { PrintingService, PrintResult, ViewPaddingBehavior } from "./index";
import { canvasToPng, createBlockUserOverlay } from "./utils";
import { Resource } from "@open-pioneer/core";

export type FileFormatType = "png" | "pdf";

const DEFAULT_FILE_NAME = "map";

export interface ExportOptions {
    title?: string | undefined;
    fileFormat: FileFormatType;
}

export class PrintingController {
    private olMap: OlMap;
    private i18n: I18n;

    private printingService: PrintingService;
    private viewPadding: ViewPaddingBehavior | undefined;

    private printMap: PrintResult | undefined = undefined;
    private overlay: Resource | undefined = undefined;

    constructor(olMap: OlMap, printingService: PrintingService, i18n: I18n) {
        this.olMap = olMap;
        this.printingService = printingService;
        this.i18n = i18n;
    }

    destroy() {
        this.reset();
    }

    setViewPadding(padding: ViewPaddingBehavior) {
        this.viewPadding = padding;
    }

    async handleMapExport(options: ExportOptions) {
        if (!this.olMap) {
            return;
        }

        try {
            this.begin();
            this.printMap = await this.printingService.printMap(this.olMap, {
                blockUserInteraction: false,
                viewPadding: this.viewPadding
            });
            const canvas = this.printMap.getCanvas();
            if (canvas) {
                options.fileFormat == "png"
                    ? await this.exportMapInPNG(canvas, options)
                    : await this.exportMapInPDF(canvas, options);
            } else {
                throw new Error("Canvas export failed");
            }
        } finally {
            this.reset();
        }
    }

    private begin() {
        const container = this.olMap.getTargetElement();
        if (container) {
            this.overlay = createBlockUserOverlay(container, this.i18n.overlayText);
        }
    }

    private reset() {
        this.overlay?.destroy();
        this.overlay = undefined;
    }

    private getTitleAndFileName(options: ExportOptions) {
        const titleValue = options.title || "";
        const fileName = options.title || DEFAULT_FILE_NAME;
        return { title: titleValue, fileName: fileName };
    }

    private async exportMapInPNG(mapCanvas: HTMLCanvasElement, options: ExportOptions) {
        const containerCanvas = document.createElement("canvas");
        containerCanvas.width = mapCanvas.width;
        containerCanvas.height = mapCanvas.height + 50;
        containerCanvas.style.backgroundColor = "#fff";

        const context = containerCanvas.getContext("2d");
        if (!context) {
            throw new Error("2d canvas rendering context not available");
        }

        const { title, fileName } = this.getTitleAndFileName(options);

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

        const dataURL = canvasToPng(containerCanvas);
        if (!dataURL) {
            throw new Error("Failed to get image data URL");
        }

        link.href = dataURL;
        link.click();
    }

    private async exportMapInPDF(canvas: HTMLCanvasElement, options: ExportOptions) {
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
        const { title, fileName } = this.getTitleAndFileName(options);
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
