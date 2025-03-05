// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { vi, it, expect, afterEach } from "vitest";
import { PrintingController } from "./PrintingController";
import OlMap from "ol/Map";
import { createManualPromise } from "@open-pioneer/core";
import { createService } from "@open-pioneer/test-utils/services";
import { PrintJob, PrintingServiceImpl } from "./PrintingServiceImpl";

afterEach(() => {
    vi.restoreAllMocks();
});

it("calls the appropriate methods (happy path)", async () => {
    const { controller, exportMapInPNGSpy, exportMapInPDFSpy } = await setUp();

    await controller.handleMapExport({
        fileFormat: "png"
    });

    //expect(exportToCanvasSpy).toBeCalled();
    expect(exportMapInPNGSpy).toBeCalled();

    await controller.handleMapExport({
        fileFormat: "pdf"
    });

    expect(exportMapInPDFSpy).toBeCalled();
});

it("creates an overlay during export and removes it after export", async () => {
    const { olMap, exportToCanvasSpy, controller } = await setUp();

    // Block the canvas export until we tell it to continue.
    // This way, we can test the intermediate state (overlay present etc.)
    // Note that this is pretty ugly - it relies on implementation details.
    const { promise, resolve } = createManualPromise();
    exportToCanvasSpy.mockImplementation(() => promise);

    // Start the export, but do _not_ wait for it to finish.
    const exportDonePromise = controller.handleMapExport({
        fileFormat: "pdf"
    });

    // Wait for the overlay to appear.
    const overlay = await vi.waitFor(() => {
        const overlay = findOverlay(olMap);
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
    expect(findOverlay(olMap)).toBe(undefined);
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
    const olMap = new OlMap();
    const target = document.createElement("div");
    olMap.setTarget(target);

    const printingService = await createService(PrintingServiceImpl, {});
    const exportToCanvasSpy = vi.spyOn(PrintJob.prototype as any, "printToCanvas");
    exportToCanvasSpy.mockImplementation(() => document.createElement("canvas"));

    const overlayText = { overlayText: "Map printing ..." };
    const controller = new PrintingController(olMap, printingService, overlayText);

    const exportMapInPNGSpy = vi.spyOn(controller as any, "exportMapInPNG");
    const exportMapInPDFSpy = vi.spyOn(controller as any, "exportMapInPDF");

    exportMapInPNGSpy.mockImplementation(() => undefined);
    exportMapInPDFSpy.mockImplementation(() => undefined);

    return { olMap, controller, exportToCanvasSpy, exportMapInPNGSpy, exportMapInPDFSpy };
}
