// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Resource } from "@open-pioneer/core";
import { LayerFactory, SimpleLayer } from "@open-pioneer/map";
import { MapModel } from "@open-pioneer/map/model/MapModel";
import { EventsKey } from "ol/events";
import VectorLayer from "ol/layer/Vector";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import { Pixel } from "ol/pixel";
import { getRenderPixel } from "ol/render";
import RenderEvent from "ol/render/Event";
import VectorSource from "ol/source/Vector";
import {
    FileFormatType,
    PageOrientationType,
    PageFormatType,
    PrintingService,
    PrintResult,
    ViewPaddingBehavior
} from "./index";
import {
    canvasToPng,
    createBlockUserOverlay,
    drawPrintArea,
    getPageSize,
    getPixelBounds
} from "./utils";

const DEFAULT_FILE_NAME = "map";

export interface ExportOptions {
    title?: string | undefined;
    fileFormat: FileFormatType;
    dpi: number;
}

export class PrintingController {
    #map: MapModel;
    #olMap: OlMap;
    #printingService: PrintingService;
    #i18n: I18n;

    #viewPadding: ViewPaddingBehavior | undefined;
    #pageFormat: PageFormatType | undefined;
    #orientation: PageOrientationType | undefined;
    #scale: number | undefined;

    #printMap: PrintResult | undefined = undefined;
    #overlay: Resource | undefined = undefined;
    #printAreaLayer: SimpleLayer;
    #postrenderListener: EventsKey;

    constructor(
        map: MapModel,
        layerFactory: LayerFactory,
        printingService: PrintingService,
        i18n: I18n
    ) {
        this.#map = map;
        this.#olMap = map.olMap;
        this.#printingService = printingService;
        this.#i18n = i18n;

        const vectorLayer = new VectorLayer({
            source: new VectorSource({
                useSpatialIndex: false,
                wrapX: true
            })
        });
        this.#printAreaLayer = layerFactory.create({
            type: SimpleLayer,
            internal: true,
            title: "print-area-layer",
            olLayer: vectorLayer
        });

        this.#map.layers.addLayer(this.#printAreaLayer, { at: "topmost" });

        this.#postrenderListener = vectorLayer.on("postrender", (event) => {
            this.#showPrintArea(event);
        });
    }

    destroy() {
        this.#reset();
        unByKey(this.#postrenderListener);
        this.#map.layers.removeLayer(this.#printAreaLayer);
    }

    setViewPadding(padding: ViewPaddingBehavior) {
        this.#viewPadding = padding;
        this.#updatePrintArea();
    }

    setPageFormat(pageFormat: PageFormatType) {
        this.#pageFormat = pageFormat;
        this.#updatePrintArea();
    }

    setOrientation(orientation: PageOrientationType) {
        this.#orientation = orientation;
        this.#updatePrintArea();
    }

    setScale(scale: number) {
        this.#scale = scale;
        this.#updatePrintArea();
    }

    #updatePrintArea(): void {
        this.#printAreaLayer.olLayer.changed();
    }

    #showPrintArea(renderEvent: RenderEvent) {
        const context = renderEvent.context;
        if (!this.#isCanvasRenderingContext2D(context)) return;

        if (!this.#pageFormat || !this.#orientation || !this.#scale) return;
        const printArea = getPixelBounds(this.#map, this.#pageFormat, this.#orientation, this.#scale);
        if (!printArea) return;
        const printAreaCanvas = this.#viewportToCanvas(printArea, renderEvent);

        drawPrintArea(context, printAreaCanvas);
    }

    #viewportToCanvas(printArea: number[], renderEvent: RenderEvent) {
        const [minX, minY, maxX, maxY] = printArea;

        const min = getRenderPixel(renderEvent, [minX, minY] as Pixel) as [
            number,
            number
        ];
        const max = getRenderPixel(renderEvent, [maxX, maxY] as Pixel) as [
            number,
            number
        ];

        return [min[0], min[1], max[0], max[1]];
    }

    #isCanvasRenderingContext2D(context: unknown): context is CanvasRenderingContext2D {
        return context != null && context instanceof CanvasRenderingContext2D;
    }

    async handleMapExport(options: ExportOptions) {
        if (!this.#pageFormat || !this.#orientation || !this.#scale) {
            throw new Error("Printing params undefined");
        }

        try {
            this.#begin();

            const { paperHeight, paperWidth } = getPageSize(this.#pageFormat, this.#orientation);

            this.#printMap = await this.#printingService.printMap(this.#map, {
                blockUserInteraction: false,
                viewPadding: this.#viewPadding,
                dpi: options.dpi,
                scale: this.#scale,
                height: paperHeight,
                width: paperWidth
            });
            const canvas = this.#printMap.getCanvas();
            if (options.fileFormat == "png") {
                await this.exportMapInPNG(canvas, options);
            } else {
                await this.exportMapInPDF(canvas, options);
            }
        } finally {
            this.#reset();
        }
    }

    #begin() {
        const container = this.#olMap.getTargetElement();
        if (container) {
            this.#overlay = createBlockUserOverlay(container, this.#i18n.overlayText);
        }
        this.#printAreaLayer.setVisible(false);
    }

    #reset() {
        this.#overlay?.destroy();
        this.#overlay = undefined;
        this.#printAreaLayer.setVisible(true);
    }

    #getTitleAndFileName(options: ExportOptions) {
        const titleValue = options.title || "";
        const fileName = options.title || DEFAULT_FILE_NAME;
        return { title: titleValue, fileName: fileName };
    }

    // Kept as a TypeScript `private` method (not a `#` private) so tests can replace it via
    // `vi.spyOn(controller, ...)` to isolate export-format dispatch from actual file export.
    private async exportMapInPNG(mapCanvas: HTMLCanvasElement, options: ExportOptions) {
        const containerCanvas = document.createElement("canvas");
        containerCanvas.width = mapCanvas.width;
        containerCanvas.height = mapCanvas.height + 50;
        containerCanvas.style.backgroundColor = "#fff";

        const context = containerCanvas.getContext("2d");
        if (!context) {
            throw new Error("2d canvas rendering context not available");
        }

        const { title, fileName } = this.#getTitleAndFileName(options);

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

    // Kept as a TypeScript `private` method (not a `#` private) so tests can replace it via
    // `vi.spyOn(controller, ...)` to isolate export-format dispatch from actual file export.
    private async exportMapInPDF(canvas: HTMLCanvasElement, options: ExportOptions) {
        // Landscape map export.
        // Lazy load pdfjs as well.
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({
            orientation: this.#orientation,
            unit: "mm",
            format: this.#pageFormat
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
        const { title, fileName } = this.#getTitleAndFileName(options);
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
