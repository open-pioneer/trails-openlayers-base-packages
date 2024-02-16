// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { vi, it, expect, afterEach } from "vitest";
import { PrintingController } from "./PrintingController";
import OlMap from "ol/Map";
import { createManualPromise } from "@open-pioneer/core";
import { ScaleLine } from "ol/control";

afterEach(() => {
    vi.restoreAllMocks();
});

it("calls the appropriate methods (happy path)", async () => {
    const { controller, exportToCanvasSpy, exportMapInPNGSpy, exportMapInPDFSpy } = setUp();

    controller.setFileFormat("png");
    await controller.handleMapExport();

    expect(exportToCanvasSpy).toBeCalled();
    expect(exportMapInPNGSpy).toBeCalled();

    controller.setFileFormat("pdf");
    await controller.handleMapExport();

    expect(exportMapInPDFSpy).toBeCalled();
});

it("creates an overlay during export and removes it after export", async () => {
    const { olMap, exportToCanvasSpy, controller } = setUp();

    // Block the canvas export until we tell it to continue.
    // This way, we can test the intermediate state (overlay present etc.)
    // Note that this is pretty ugly - it relies on implementation details.
    const { promise, resolve } = createManualPromise();
    exportToCanvasSpy.mockImplementation(() => promise);

    // Start the export, but do _not_ wait for it to finish.
    const exportDonePromise = controller.handleMapExport();

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

it("adds scale-line during export and removes it after export", async () => {
    const { olMap, exportToCanvasSpy, controller } = setUp();

    const { promise, resolve } = createManualPromise();
    exportToCanvasSpy.mockImplementation(() => promise);

    // Start the export, but do _not_ wait for it to finish.
    const exportDonePromise = controller.handleMapExport();

    // Wait for the scale-line to be added.
    const scaleLine = await vi.waitFor(() => {
        const scaleLine = findScaleLine(olMap);
        if (!scaleLine) {
            throw new Error("Failed to find scale-line");
        }
        return scaleLine;
    });

    //scale-line has been added
    expect(scaleLine).toBeDefined();

    // Continue from canvas export
    resolve(document.createElement("canvas"));

    // Wait for the method to complete
    await exportDonePromise;

    // scale-line has been removed
    expect(findScaleLine(olMap)).toBe(undefined);
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

function findScaleLine(olMap: OlMap) {
    const scaleLine = olMap
        .getControls()
        .getArray()
        .find((control) => control instanceof ScaleLine);
    if (!scaleLine) {
        return undefined;
    }

    return scaleLine;
}

function setUp() {
    const olMap = new OlMap();
    const target = document.createElement("div");
    olMap.setTarget(target);

    const overlayText = { overlayText: "Map printing ..." };

    const controller = new PrintingController(olMap, overlayText);

    const exportToCanvasSpy = vi.spyOn(controller as any, "exportToCanvas");
    const exportMapInPNGSpy = vi.spyOn(controller as any, "exportMapInPNG");
    const exportMapInPDFSpy = vi.spyOn(controller as any, "exportMapInPDF");

    exportToCanvasSpy.mockImplementation(() => document.createElement("canvas"));
    exportMapInPNGSpy.mockImplementation(() => undefined);
    exportMapInPDFSpy.mockImplementation(() => undefined);

    return { olMap, controller, exportToCanvasSpy, exportMapInPNGSpy, exportMapInPDFSpy };
}
