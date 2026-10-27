// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { createManualPromise } from "@open-pioneer/core";
import { SimpleLayer } from "@open-pioneer/map";
import { setupMap } from "@open-pioneer/map-test-utils";
import { createService } from "@open-pioneer/test-utils/services";
import BaseLayer from "ol/layer/Base";
import OlMap from "ol/Map";
import RenderEvent from "ol/render/Event";
import { vi, it, expect, afterEach, beforeEach } from "vitest";
import { PageFormatType, PageOrientationType, ViewPaddingBehavior } from "./index";
import { PrintingController } from "./PrintingController";
import { PrintJob, PrintingServiceImpl } from "./PrintingServiceImpl";
import * as utils from "./utils";
import { getPageSize } from "./utils";

vi.mock("./utils", async (importOriginal) => {
    const original = await importOriginal<typeof import("./utils")>();
    return {
        ...original,
        drawPrintArea: vi.fn()
    };
});

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

it("calls the appropriate methods (happy path)", async () => {
    const { controller, exportMapInPNGSpy, exportMapInPDFSpy } = await setUp();

    controller.setPageFormat("a4");
    controller.setOrientation("portrait");
    controller.setScale(25000);

    await controller.handleMapExport({
        fileFormat: "png",
        dpi: 96
    });

    expect(exportMapInPNGSpy).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), {
        fileFormat: "png",
        dpi: 96
    });

    await controller.handleMapExport({
        fileFormat: "pdf",
        dpi: 96
    });

    expect(exportMapInPDFSpy).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), {
        fileFormat: "pdf",
        dpi: 96
    });
});

it("creates an overlay during export and removes it after export", async () => {
    const { map, exportToCanvasSpy, controller } = await setUp();

    // Block the canvas export until we tell it to continue.
    // This way, we can test the intermediate state (overlay present etc.)
    // Note that this is pretty ugly - it relies on implementation details.
    const { promise, resolve } = createManualPromise();
    exportToCanvasSpy.mockImplementation(() => promise);

    controller.setPageFormat("a4");
    controller.setOrientation("portrait");
    controller.setScale(25000);

    // Start the export, but do _not_ wait for it to finish.
    const exportDonePromise = controller.handleMapExport({
        fileFormat: "pdf",
        dpi: 96
    });

    // Wait for the overlay to appear.
    const overlay = await vi.waitFor(() => {
        const overlay = findOverlay(map.olMap);
        if (!overlay) {
            throw new Error("Failed to find overlay");
        }
        return overlay;
    });
    expect(overlay.textContent).toBe("Map printing ...");

    // Continue from canvas export
    resolve(document.createElement("canvas"));

    // Wait for the method to complete
    await exportDonePromise;

    // Overlay has been removed
    expect(findOverlay(map.olMap)).toBeUndefined();
});

it("removes the overlay after a failed export", async () => {
    const { map, printingService, controller } = await setUp();

    const { promise, reject } = createManualPromise();

    const printMapSpy = vi.spyOn(printingService as any, "printMap");
    printMapSpy.mockImplementation(() => promise);

    controller.setPageFormat("a4");
    controller.setOrientation("portrait");
    controller.setScale(25000);

    const exportDonePromise = controller.handleMapExport({
        fileFormat: "pdf",
        dpi: 96
    });

    reject(new Error("error"));

    await expect(exportDonePromise).rejects.toThrow("error");

    // Overlay has been removed
    expect(findOverlay(map.olMap)).toBeUndefined();
});

it("creates and adds a layer at topmost position to visualize the print area", async () => {
    const { map, layerCreateSpy, addLayerSpy } = await setUp();

    expect(layerCreateSpy).toHaveBeenCalledExactlyOnceWith({
        type: SimpleLayer,
        internal: true,
        title: expect.any(String),
        olLayer: expect.any(BaseLayer)
    });
    const layer = layerCreateSpy.mock.results.at(-1);

    expect(addLayerSpy).toHaveBeenCalledExactlyOnceWith(layer?.value, { at: "topmost" });

    const drawLayer = map.layers.getLayerById(layer?.value.id);
    expect(drawLayer).toBeDefined();
    expect(drawLayer?.visible).toBe(true);
});

it("draws the area to be printed on a map overlay on every map re-render", async () => {
    const { map, controller, addLayerSpy } = await setUp();

    vi.spyOn(controller as any, "isCanvasRenderingContext2D").mockReturnValue(true);
    vi.spyOn(controller as any, "viewportToCanvas").mockReturnValue([10, 20, 30, 40]);
    const getPixelBoundsSpy = vi.spyOn(utils, "getPixelBounds").mockReturnValue([10, 20, 30, 40]);
    const drawPrintAreaSpy = vi.spyOn(utils, "drawPrintArea");

    const layer = addLayerSpy.mock.lastCall![0] as SimpleLayer;

    controller.setPageFormat("a4");
    controller.setOrientation("portrait");
    controller.setScale(25000);

    const context = {} as any;
    const event = new RenderEvent("postrender", undefined, undefined, context);
    layer.olLayer.dispatchEvent(event);

    expect(getPixelBoundsSpy).toHaveBeenCalledWith(map, "a4", "portrait", 25000);

    expect(drawPrintAreaSpy).toHaveBeenCalledWith(context, [10, 20, 30, 40]);
});

it("does not draw the print area until page format, orientation and scale are configured", async () => {
    const { controller, addLayerSpy } = await setUp();

    vi.spyOn(controller as any, "isCanvasRenderingContext2D").mockReturnValue(true);
    vi.spyOn(controller as any, "viewportToCanvas").mockReturnValue([10, 20, 30, 40]);
    const drawPrintAreaSpy = vi.spyOn(utils, "drawPrintArea");

    const layer = addLayerSpy.mock.lastCall![0] as SimpleLayer;

    const context = {} as any;
    const event = new RenderEvent("postrender", undefined, undefined, context);

    controller.setPageFormat("a4");
    layer.olLayer.dispatchEvent(event);
    expect(drawPrintAreaSpy).not.toHaveBeenCalled();

    controller.setOrientation("portrait");
    layer.olLayer.dispatchEvent(event);
    expect(drawPrintAreaSpy).not.toHaveBeenCalled();

    controller.setScale(1000);
    layer.olLayer.dispatchEvent(event);
    expect(drawPrintAreaSpy).toHaveBeenCalled();
});

it("updates the print area when output params changed using setter", async () => {
    const { controller, addLayerSpy } = await setUp();

    const layer = addLayerSpy.mock.lastCall![0] as SimpleLayer;
    const changedSpy = vi.spyOn(layer.olLayer, "changed");

    controller.setViewPadding("none" as never);
    controller.setPageFormat("a4" as never);
    controller.setOrientation("landscape" as never);
    controller.setScale(25000);

    expect(changedSpy).toHaveBeenCalledTimes(4);
});

it("does not draw the print area when no pixel bounds can be calculated", async () => {
    const { controller, addLayerSpy } = await setUp();

    vi.spyOn(controller as any, "isCanvasRenderingContext2D").mockReturnValue(true);
    vi.spyOn(controller as any, "viewportToCanvas").mockReturnValue([10, 20, 30, 40]);
    const drawPrintAreaSpy = vi.spyOn(utils, "drawPrintArea");

    const layer = addLayerSpy.mock.lastCall![0] as SimpleLayer;

    const context = {} as any;
    const event = new RenderEvent("postrender", undefined, undefined, context);

    vi.spyOn(utils, "getPixelBounds").mockReturnValue(undefined);

    controller.setPageFormat("a4");
    controller.setOrientation("portrait");
    controller.setScale(25000);

    layer.olLayer.dispatchEvent(event);

    expect(drawPrintAreaSpy).not.toHaveBeenCalled();
});

it("hides the visualization of the print area during export and shows it again after export", async () => {
    const { map, exportToCanvasSpy, controller, layerCreateSpy } = await setUp();

    const layer = layerCreateSpy.mock.results.at(-1);
    const drawLayer = map.layers.getLayerById(layer?.value.id);

    const { promise, resolve } = createManualPromise();
    exportToCanvasSpy.mockImplementation(() => promise);

    expect(drawLayer).toBeDefined();
    expect(drawLayer?.visible).toBe(true);

    controller.setPageFormat("a4");
    controller.setOrientation("portrait");
    controller.setScale(25000);

    const exportDonePromise = controller.handleMapExport({
        fileFormat: "pdf",
        dpi: 96
    });

    expect(drawLayer?.visible).toBe(false);

    resolve(document.createElement("canvas"));

    await exportDonePromise;

    expect(drawLayer?.visible).toBe(true);
});

it("shows the visualization of the print area again after failed export", async () => {
    const { map, printingService, controller, layerCreateSpy } = await setUp();

    const layer = layerCreateSpy.mock.results.at(-1);
    const drawLayer = map.layers.getLayerById(layer?.value.id);

    const { promise, reject } = createManualPromise();

    const printMapSpy = vi.spyOn(printingService as any, "printMap");
    printMapSpy.mockImplementation(() => promise);

    expect(drawLayer).toBeDefined();
    expect(drawLayer?.visible).toBe(true);

    controller.setPageFormat("a4");
    controller.setOrientation("portrait");
    controller.setScale(25000);

    const exportDonePromise = controller.handleMapExport({
        fileFormat: "pdf",
        dpi: 96
    });

    expect(drawLayer?.visible).toBe(false);

    reject(new Error("error"));

    await expect(exportDonePromise).rejects.toThrow("error");

    expect(drawLayer?.visible).toBe(true);
});

it("throws an error when map export is started without setting target output", async () => {
    const { controller } = await setUp();

    await expect(() =>
        controller.handleMapExport({
            fileFormat: "png",
            dpi: 300
        })
    ).rejects.toThrow(expect.any(Error));

    controller.setOrientation("landscape");

    await expect(() =>
        controller.handleMapExport({
            fileFormat: "png",
            dpi: 300
        })
    ).rejects.toThrow(expect.any(Error));

    controller.setPageFormat("a4");

    await expect(() =>
        controller.handleMapExport({
            fileFormat: "png",
            dpi: 300
        })
    ).rejects.toThrow(expect.any(Error));

    controller.setScale(10000);

    const returnValue = await controller.handleMapExport({
        fileFormat: "png",
        dpi: 300
    });

    expect(returnValue).toBeUndefined();
});

it("calls the printing service with correct parameters", async () => {
    const { map, controller, printingService } = await setUp();

    const printMapSpy = vi.spyOn(printingService as any, "printMap");

    const dpi = 150;
    const orientation: PageOrientationType = "landscape";
    const pageFormat: PageFormatType = "a3";
    const scale = 8000;
    const viewPadding: ViewPaddingBehavior = "ignore";

    const { paperHeight, paperWidth } = getPageSize(pageFormat, orientation);

    controller.setOrientation(orientation);
    controller.setPageFormat(pageFormat);
    controller.setScale(scale);

    await controller.handleMapExport({
        fileFormat: "png",
        dpi: dpi
    });

    expect(printMapSpy).toHaveBeenCalledWith(map, {
        blockUserInteraction: false,
        viewPadding: undefined,
        dpi: dpi,
        scale: scale,
        height: paperHeight,
        width: paperWidth
    });

    controller.setOrientation("portrait");
    controller.setViewPadding(viewPadding);

    await controller.handleMapExport({
        fileFormat: "png",
        dpi: dpi
    });

    expect(printMapSpy).toHaveBeenCalledWith(map, {
        blockUserInteraction: false,
        viewPadding: viewPadding,
        dpi: dpi,
        scale: scale,
        height: paperWidth, // flip page
        width: paperHeight
    });
});

it("removes the listener, the overlay and print area layer when destroyed", async () => {
    const { map, controller, layerCreateSpy, removeLayerSpy } = await setUp();

    const layer = layerCreateSpy.mock.results.at(-1);

    controller.setOrientation("landscape");
    controller.setPageFormat("a3");
    controller.setScale(8000);

    controller.destroy();

    // print area layer removed from map
    expect(removeLayerSpy).toHaveBeenCalledExactlyOnceWith(layer?.value);

    // overlay removed
    expect(findOverlay(map.olMap)).toBeUndefined();
});

function findOverlay(olMap: OlMap) {
    const target = olMap.getTarget() as HTMLElement | undefined;
    if (!target) {
        throw new Error("target not present");
    }

    const overlay = target.querySelector(".printing-overlay");
    if (!overlay) {
        return undefined;
    }
    return overlay;
}

async function setUp() {
    const target = document.createElement("div");

    const { mapId, registry, layerFactory } = await setupMap({ mapId: "printing-controller-test" });
    const map = await registry.expectMapModel(mapId);
    map.olMap.setTarget(target);

    const layerCreateSpy = vi.spyOn(layerFactory as any, "create");

    const addLayerSpy = vi.spyOn(map.layers as any, "addLayer");
    const removeLayerSpy = vi.spyOn(map.layers as any, "removeLayer");

    const printingService = createService(PrintingServiceImpl, {});

    const exportToCanvasSpy = vi.spyOn(PrintJob.prototype as any, "printToCanvas");
    exportToCanvasSpy.mockImplementation(() => document.createElement("canvas"));

    const overlayText = { overlayText: "Map printing ..." };
    const controller = new PrintingController(map, layerFactory, printingService, overlayText);

    const exportMapInPNGSpy = vi.spyOn(controller as any, "exportMapInPNG");
    const exportMapInPDFSpy = vi.spyOn(controller as any, "exportMapInPDF");

    exportMapInPNGSpy.mockImplementation(() => undefined);
    exportMapInPDFSpy.mockImplementation(() => undefined);

    return {
        map,
        controller,
        layerFactory,
        layerCreateSpy,
        addLayerSpy,
        removeLayerSpy,
        printingService,
        exportToCanvasSpy,
        exportMapInPNGSpy,
        exportMapInPDFSpy
    };
}
