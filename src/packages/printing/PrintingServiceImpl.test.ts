// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { expect, it, vi } from "vitest";
import OlMap from "ol/Map";
import { createService } from "@open-pioneer/test-utils/services";
import { PrintingServiceImpl, PrintJob } from "./PrintingServiceImpl";
import { ScaleLine } from "ol/control";
import { afterEach } from "vitest";
import { createManualPromise } from "@open-pioneer/core";

afterEach(() => {
    vi.restoreAllMocks();
});

it("Should successfully print a canvas", async () => {
    const { olMap, printToCanvasSpy, printingService } = await setUp();

    printToCanvasSpy.mockImplementation(() => document.createElement("canvas"));

    const printResult = await printingService.printMap(olMap);
    const canvas = printResult.getCanvas();

    expect(canvas).toBeDefined();
    expect(canvas.tagName).toBe("CANVAS");
});

it("should create an overlay during print and removes it after print", async () => {
    const { olMap, printToCanvasSpy, printingService } = await setUp();

    // Block the canvas print until we tell it to continue.
    // This way, we can test the intermediate state (overlay present etc.)
    // Note that this is pretty ugly - it relies on implementation details.
    const { promise, resolve } = createManualPromise();
    printToCanvasSpy.mockImplementation(() => promise);

    // Start the export, but do _not_ wait for it to finish.
    const printDonePromise = printingService.printMap(olMap, { overlayText: "Overlay is added" });

    // Wait for the overlay to appear.
    const overlay = await vi.waitFor(() => {
        const overlay = findOverlay(olMap);
        if (!overlay) {
            throw new Error("Failed to find overlay");
        }
        return overlay;
    });

    expect(overlay.textContent).toBe("Overlay is added");

    // Continue from canvas print
    resolve(document.createElement("canvas"));

    // Wait for the method to complete
    await printDonePromise;

    // Overlay has been removed
    expect(findOverlay(olMap)).toBe(undefined);
});

it("should not create an overlay if `blockUserInteraction` is set to false", async () => {
    const { olMap, printToCanvasSpy, printingService } = await setUp();

    // Block the canvas print until we tell it to continue.
    // This way, we can test the intermediate state (overlay present etc.)
    // Note that this is pretty ugly - it relies on implementation details.
    const { promise, resolve } = createManualPromise();
    printToCanvasSpy.mockImplementation(() => promise);

    // Start the export, but do _not_ wait for it to finish.
    const printDonePromise = printingService.printMap(olMap, {
        blockUserInteraction: false,
        overlayText: "Overlay is added"
    });

    // Wait for the overlay to appear.
    const overlay = await vi.waitFor(() => {
        const overlay = findOverlay(olMap);
        if (overlay) {
            throw new Error("Overlay shouldn't be created");
        }
        return overlay;
    });

    expect(overlay).toBeUndefined();

    // Continue from canvas print
    resolve(document.createElement("canvas"));

    // Wait for the method to complete
    await printDonePromise;
});

it("adds scale-line during print and removes it after print", async () => {
    const { olMap, printToCanvasSpy, printingService } = await setUp();

    const { promise, resolve } = createManualPromise();
    printToCanvasSpy.mockImplementation(() => promise);

    // Start the print, but do _not_ wait for it to finish.
    const printDonePromise = printingService.printMap(olMap);

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

    // Continue from canvas print
    resolve(document.createElement("canvas"));

    // Wait for the method to complete
    await printDonePromise;

    // scale-line has been removed
    expect(findScaleLine(olMap)).toBe(undefined);
});

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
    const printToCanvasSpy = vi.spyOn(PrintJob.prototype as any, "printToCanvas");
    printToCanvasSpy.mockImplementation(() => document.createElement("canvas"));

    return { olMap, printToCanvasSpy, printingService };
}
