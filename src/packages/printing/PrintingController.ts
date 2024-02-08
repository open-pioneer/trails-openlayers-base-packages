// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import OlMap from "ol/Map";
import { ScaleLine } from "ol/control";
import Overlay from "ol/Overlay";
import html2canvas, { Options } from "html2canvas";
import { createManualPromise } from "@open-pioneer/core";
import { jsPDF } from "jspdf";

export type FileFormatType = "png" | "pdf";

const DEFAULT_FILE_NAME = "map";
const DEFAULT_TITLE = "My own map";

export class PrintingController {
    private olMap: OlMap;
    private title: string = "";
    private fileFormat: FileFormatType = "pdf";

    private scaleLine: ScaleLine | undefined = undefined;

    private overlay: Overlay | undefined = undefined;

    constructor(olMap: OlMap) {
        this.olMap = olMap;
    }

    destroy() {
        this.removeScaleLine();
    }

    setTitle(title: string) {
        this.title = title;
    }

    setFileFormat(format: FileFormatType) {
        this.fileFormat = format;
    }

    private removeScaleLine() {
        if (this.scaleLine) {
            this.olMap.removeControl(this.scaleLine);
            this.scaleLine = undefined;
        }
    }

    async handleMapExport() {
        if (!this.olMap || !this.fileFormat) {
            return;
        }

        await this.handleScaleLine();

        // export options for html2canvas.
        const exportOptions: Partial<Options> = {
            useCORS: true,
            ignoreElements: function (element: Element) {
                const classNames: string = element.className || "";
                if (typeof classNames === "object") return false;

                return classNames.includes("map-anchors");
            }
        };

        const canvas = await html2canvas(this.olMap.getViewport(), exportOptions);
        if (canvas) {
            this.fileFormat == "png" ? this.exportMapInPNG(canvas) : this.exportMapInPDF(canvas);
        } else {
            throw new Error("Canvas export failed");
        }
    }

    async handleScaleLine() {
        this.scaleLine = new ScaleLine({ bar: true, text: true, minWidth: 125 });
        const renderPromise = createManualPromise<void>();
        const oldRender = this.scaleLine.render;
        this.scaleLine.render = (...args) => {
            oldRender.apply(this.scaleLine, args);
            renderPromise.resolve();
        };
        this.olMap.addControl(this.scaleLine);
        await renderPromise.promise;
        await new Promise((resolve) => {
            requestAnimationFrame(resolve);
        });
    }

    getTitleAndFileName() {
        const titleValue = this.title || DEFAULT_TITLE;
        const fileName = this.title || DEFAULT_FILE_NAME;
        return { title: titleValue, fileName: fileName };
    }

    exportMapInPNG(mapCanvas: HTMLCanvasElement) {
        const containerCanvas = document.createElement("canvas");
        containerCanvas.width = mapCanvas.width;
        containerCanvas.height = mapCanvas.height + 50;
        containerCanvas.style.backgroundColor = "#fff";

        const context = containerCanvas.getContext("2d");

        const { title, fileName } = this.getTitleAndFileName();

        if (context) {
            context.fillStyle = "#fff"; // background color for background rect
            context.fillRect(0, 0, containerCanvas.width, containerCanvas.height); //draw background rect
            context.font = 20 + "px bold Arial";
            context.textAlign = "center";
            context.fillStyle = "#000"; // text color

            const x = containerCanvas.width / 2; //align text to center
            context.fillText(title, x, 20);
        }
        context?.drawImage(mapCanvas, 0, 50);

        const link = document.createElement("a");
        link.setAttribute("download", fileName + ".png");
        link.href = containerCanvas.toDataURL("image/png", 0.8);
        link.click();
        this.destroy();
    }

    exportMapInPDF(canvas: HTMLCanvasElement) {
        // Landscape map export
        const size = this.olMap.getSize();
        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: size
        });

        const imgUrlStr = canvas.toDataURL("image/jpeg");

        pdf.setFontSize(20);
        if (size && size[0] && size[1]) {
            const { title, fileName } = this.getTitleAndFileName();

            const height = size[1];
            const width = size[0];
            pdf.addImage(imgUrlStr, "JPEG", 0, 50, width, height - 50);
            pdf.text(title, width / 2, 30, { align: "center" });
            pdf.save(fileName + ".pdf");
            this.destroy();
        }
    }
}
