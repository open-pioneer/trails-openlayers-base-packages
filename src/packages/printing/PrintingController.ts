// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import OlMap from "ol/Map";
import { PrintingService, PrintResult, ViewPaddingBehavior } from "./index";
import {
    canvasToPng,
    createBlockUserOverlay,
    getPageDimensions,
    getResolution,
    getViewPadding,
    PageOrientationType,
    PageSizeType
} from "./utils";
import { Resource } from "@open-pioneer/core";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { getRenderPixel } from "ol/render";
import RenderEvent from "ol/render/Event";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";

export type FileFormatType = "png" | "pdf";

const DEFAULT_FILE_NAME = "map";

export interface ExportOptions {
    title?: string | undefined;
    fileFormat: FileFormatType;
    resolution: number;
}

export class PrintingController {
    private olMap: OlMap;
    private i18n: I18n;

    private printingService: PrintingService;
    private viewPadding: ViewPaddingBehavior | undefined;
    private size: PageSizeType | undefined;
    private orientation: PageOrientationType | undefined;
    private scale: number | undefined;

    private printMap: PrintResult | undefined = undefined;
    private overlay: Resource | undefined = undefined;
    private printAreaLayer: VectorLayer;
    private postrenderListener: EventsKey;
    private renderEvent: RenderEvent | undefined;

    constructor(olMap: OlMap, printingService: PrintingService, i18n: I18n) {
        this.olMap = olMap;
        this.printingService = printingService;
        this.i18n = i18n;

        this.printAreaLayer = new VectorLayer({
            source: new VectorSource({
                useSpatialIndex: false,
                wrapX: true
            }),
            zIndex: 10000
        });
        this.olMap.addLayer(this.printAreaLayer);

        this.postrenderListener = this.printAreaLayer.on("postrender", (event) => {
            this.renderEvent = event;
            this.drawPrintArea();
        });
    }

    destroy() {
        this.reset();
        unByKey(this.postrenderListener);
        this.olMap.removeLayer(this.printAreaLayer);
    }

    setViewPadding(padding: ViewPaddingBehavior) {
        this.viewPadding = padding;
        this.drawPrintArea();
    }

    setSize(size: PageSizeType) {
        this.size = size;
        this.drawPrintArea();
    }

    setOrientation(orientation: PageOrientationType) {
        this.orientation = orientation;
        this.drawPrintArea();
    }

    setScale(scale: number) {
        this.scale = scale;
        this.drawPrintArea();
    }

    private drawPrintArea() {
        const rectangle = this.getPixelBounds();
        if (!rectangle) return;

        if (!this.renderEvent) return;
        const context = this.renderEvent.context;
        if (!context || !(context instanceof CanvasRenderingContext2D)) return;

        context.reset();

        const minx = rectangle[0];
        const miny = rectangle[1];
        const maxx = rectangle[2];
        const maxy = rectangle[3];
        if (!minx || !miny || !maxx || !maxy) return;

        const mapSize = this.olMap.getSize();
        if (!mapSize || !mapSize[0] || !mapSize[1]) return;
        const mapHeight = mapSize[1];
        const mapWidth = mapSize[0];
        if (!mapWidth || !mapHeight) return;

        context.save();

        context.beginPath();

        // outside polygon, clockwise
        context.moveTo(...(getRenderPixel(this.renderEvent, [0, 0]) as [number, number]));
        context.lineTo(...(getRenderPixel(this.renderEvent, [mapWidth, 0]) as [number, number]));
        context.lineTo(
            ...(getRenderPixel(this.renderEvent, [mapWidth, mapHeight]) as [number, number])
        );
        context.lineTo(...(getRenderPixel(this.renderEvent, [0, mapHeight]) as [number, number]));

        // inner polygon, counter-clockwise
        context.moveTo(...(getRenderPixel(this.renderEvent, [minx, miny]) as [number, number]));
        context.lineTo(...(getRenderPixel(this.renderEvent, [minx, maxy]) as [number, number]));
        context.lineTo(...(getRenderPixel(this.renderEvent, [maxx, maxy]) as [number, number]));
        context.lineTo(...(getRenderPixel(this.renderEvent, [maxx, miny]) as [number, number]));

        context.closePath();

        context.fillStyle = "rgba(0, 5, 25, 0.70)";
        context.fill();

        context.restore();
    }

    private getPixelBounds() {
        if (!this.size || !this.orientation || !this.scale) return;

        const mapSize = this.olMap.getSize();
        if (!mapSize || !mapSize[0] || !mapSize[1]) return;

        const printDimension = getPageDimensions(this.size, this.orientation);
        const padding = getViewPadding(this.olMap);

        const widthInMeters = (printDimension.width * this.scale) / 1000.0;
        const heightInMeters = (printDimension.height * this.scale) / 1000.0;

        const resolution = getResolution(this.olMap);
        if (!resolution) return;

        const pixelWidth = widthInMeters / resolution;
        const pixelHeight = heightInMeters / resolution;

        const centerPixel = [
            (mapSize[0] + padding.left - padding.right) / 2,
            (mapSize[1] + padding.top - padding.bottom) / 2
        ];
        if (!centerPixel[0] || !centerPixel[1]) return;

        const minx = centerPixel[0] - pixelWidth / 2;
        const miny = centerPixel[1] - pixelHeight / 2;
        const maxx = centerPixel[0] + pixelWidth / 2;
        const maxy = centerPixel[1] + pixelHeight / 2;

        return [minx, miny, maxx, maxy];
    }

    async handleMapExport(options: ExportOptions) {
        if (!this.olMap || !this.size || !this.orientation || !this.scale) {
            return;
        }

        try {
            this.begin();

            const { height, width } = getPageDimensions(this.size, this.orientation);

            this.printMap = await this.printingService.printMap(this.olMap, {
                blockUserInteraction: false,
                viewPadding: this.viewPadding,
                resolution: options.resolution,
                scale: this.scale,
                height: height,
                width: width
            });
            const canvas = this.printMap.getCanvas();
            if (canvas) {
                if (options.fileFormat == "png") {
                    await this.exportMapInPNG(canvas, options);
                } else {
                    await this.exportMapInPDF(canvas, options);
                }
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
        this.printAreaLayer.setVisible(false);
    }

    private reset() {
        this.overlay?.destroy();
        this.overlay = undefined;
        this.printAreaLayer.setVisible(true);
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
            orientation: this.orientation,
            unit: "mm",
            format: this.size
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
