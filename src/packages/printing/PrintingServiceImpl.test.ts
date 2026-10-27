// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { createManualPromise } from "@open-pioneer/core";
import { DEFAULT_DPI } from "@open-pioneer/map";
import { setupMap } from "@open-pioneer/map-test-utils";
import { createService } from "@open-pioneer/test-utils/services";
import { ScaleLine } from "ol/control";
import OlMap from "ol/Map";
import { expect, it, vi, afterEach, beforeEach } from "vitest";
import { PrintingServiceImpl, PrintJob } from "./PrintingServiceImpl";
import * as utils from "./utils";

vi.mock("ol/control", async (importOriginal) => {
    const actual = await importOriginal<typeof import("ol/control")>();

    class MockedScaleLine extends actual.ScaleLine {
        constructor(...args: any[]) {
            super(...args);
            ScaleLineSpy(...args);
        }
    }

    return {
        ...actual,
        ScaleLine: MockedScaleLine
    };
});

const ScaleLineSpy = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

it("Should successfully print a canvas when passing a map model", async () => {
    const { map, printingService } = await setUp();
    const printResult = await printingService.printMap(map);
    const canvas = printResult.getCanvas();

    expect(canvas).toBeDefined();
    expect(canvas.tagName).toBe("CANVAS");
});

it("Should successfully print a canvas when passing only an OlMap", async () => {
    const { olMap, printingService } = await setUp();
    const printResult = await printingService.printMap(olMap);
    const canvas = printResult.getCanvas();

    expect(canvas).toBeDefined();
    expect(canvas.tagName).toBe("CANVAS");
});

// improvement: check the real size of the generated canvas; currently not possible without canvas rendering
it("should print the map using the defined dimensions (scale, dpi, width, height) considering padding and reset to initial state after", async () => {
    const { map, printToCanvasSpy, printingService } = await setUp();

    const { promise, resolve } = createManualPromise();
    printToCanvasSpy.mockImplementation(() => promise);

    vi.spyOn(utils, "getViewPadding").mockReturnValue({ left: 12, right: 34, top: 56, bottom: 78 });

    const getScreenSizeForPageSizeSpy = vi
        .spyOn(utils, "getScreenSizeForPageSize")
        .mockReturnValue({ pixelHeight: 2000, pixelWidth: 3000 });

    const resolutionBefore = map.resolution;
    const heightBefore = map.container?.style.height;
    const widthBefore = map.container?.style.width;

    const printDonePromise = printingService.printMap(map, {
        scale: 10000,
        dpi: 300,
        height: 297,
        width: 210
    });

    expect(getScreenSizeForPageSizeSpy).toHaveBeenCalledExactlyOnceWith(
        map,
        { paperWidth: 210, paperHeight: 297 },
        10000,
        300
    );

    // size changed while printing
    const targetHeight = 2000 + 56 + 78 + "px";
    const targetWidth = 3000 + 12 + 34 + "px";
    expect(map.resolution).not.toEqual(resolutionBefore);
    expect(map.container?.style.height).toEqual(targetHeight);
    expect(map.container?.style.width).toEqual(targetWidth);

    resolve(document.createElement("canvas"));

    await printDonePromise;

    // initial state
    expect(map.resolution).toEqual(resolutionBefore);
    expect(map.container?.style.height).toEqual(heightBefore);
    expect(map.container?.style.width).toEqual(widthBefore);
});

// improvement: check the real size of the generated canvas; currently not possible without canvas rendering
it("should print the current map canvas without resizing when no dimensions are provided", async () => {
    const { map, printToCanvasSpy, printingService } = await setUp();

    const { promise, resolve } = createManualPromise();
    printToCanvasSpy.mockImplementation(() => promise);

    const resolutionBefore = map.resolution;
    const heightBefore = map.container?.style.height;
    const widthBefore = map.container?.style.width;

    const printDonePromise = printingService.printMap(map);

    // no resize while printing
    expect(map.resolution).toEqual(resolutionBefore);
    expect(map.container?.style.height).toEqual(heightBefore);
    expect(map.container?.style.width).toEqual(widthBefore);

    resolve(document.createElement("canvas"));

    await printDonePromise;
});

it("should respect the map's padding by default", async () => {
    const { olMap, removePaddingSpy, printingService } = await setUp();

    // top, right, bottom, left
    olMap.getView().padding = [10, 20, 30, 40];

    const printResult = await printingService.printMap(olMap);
    const canvas = printResult.getCanvas();
    expect(canvas).toBeDefined();

    expect(removePaddingSpy.mock.lastCall![1]).toMatchInlineSnapshot(`
      {
        "bottom": 30,
        "left": 40,
        "right": 20,
        "top": 10,
      }
    `);
});

it("should throw an error when current view resolution is undefined", async () => {
    const { map, printingService } = await setUp();

    vi.spyOn(map.olMap.getView(), "getResolution").mockReturnValue(undefined);

    await expect(() => printingService.printMap(map)).rejects.toThrow(
        "Cannot get current view resolution"
    );
});

it("should ignore the map's padding if 'viewPadding' is set to 'ignore'", async () => {
    const { olMap, removePaddingSpy, printingService } = await setUp();

    // top, right, bottom, left
    olMap.getView().padding = [10, 20, 30, 40];

    const printResult = await printingService.printMap(olMap, { viewPadding: "ignore" });
    const canvas = printResult.getCanvas();
    expect(canvas).toBeDefined();
    expect(removePaddingSpy).not.toHaveBeenCalled();
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
    expect(findOverlay(olMap)).toBeUndefined();
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
    const { map, printToCanvasSpy, printingService } = await setUp();

    const { promise, resolve } = createManualPromise();
    printToCanvasSpy.mockImplementation(() => promise);

    // Start the print, but do _not_ wait for it to finish.
    const printDonePromise = printingService.printMap(map);

    // Wait for the scale-line to be added.
    const scaleLine = await vi.waitFor(() => {
        const scaleLine = findScaleLine(map.olMap);

        if (!scaleLine) {
            throw new Error("Failed to find scale-line");
        }
        return scaleLine;
    });

    // scale-line has been added
    expect(scaleLine).toBeDefined();

    // Continue from canvas print
    resolve(document.createElement("canvas"));

    // Wait for the method to complete
    await printDonePromise;

    // scale-line has been removed
    expect(findScaleLine(map.olMap)).toBeUndefined();
});

it("sets the provided dpi for the scale line", async () => {
    const { map, printingService } = await setUp();

    await printingService.printMap(map);

    expect(ScaleLineSpy).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ dpi: DEFAULT_DPI })
    );
});

it("sets the default dpi for the scale line if no dpi was specified", async () => {
    const { map, printingService } = await setUp();

    await printingService.printMap(map, { dpi: 300 });

    expect(ScaleLineSpy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ dpi: 300 }));
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
    const { mapId, registry } = await setupMap({ mapId: "printing-service-test" });
    const map = await registry.expectMapModel(mapId);
    const olMap = map.olMap;

    const target = document.createElement("div");
    target.style.width = "800px";
    target.style.height = "600px";
    // mock values for offsetWidth and offsetHeight (always 0 because DOm elements are not rendered in tests)
    Object.defineProperty(target, "offsetWidth", {
        configurable: true,
        value: 800
    });
    Object.defineProperty(target, "offsetHeight", {
        configurable: true,
        value: 600
    });
    olMap.setTarget(target);

    const printingService = await createService(PrintingServiceImpl, {});
    const printToCanvasSpy = vi.spyOn(PrintJob.prototype as any, "printToCanvas");
    printToCanvasSpy.mockImplementation(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 200;
        return canvas;
    });

    // Cant use canvas.getContext() in tests
    const removePaddingSpy = vi.spyOn(PrintJob.prototype as any, "removePadding");
    removePaddingSpy.mockImplementation((canvas: any) => canvas);

    return { map, olMap, printToCanvasSpy, printingService, removePaddingSpy };
}
