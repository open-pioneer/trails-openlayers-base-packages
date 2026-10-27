// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { getScaleForPointResolution, MapModel } from "@open-pioneer/map";
import type OlView from "ol/View";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PageFormatType, PageOrientationType } from "./index";
import {
    createBlockUserOverlay,
    drawPrintArea,
    drawRectangle,
    getMapCenterPixel,
    getPageSize,
    getPixelBounds,
    getScreenSizeForPageSize,
    getViewPadding,
    PageSize,
    PRINTING_HIDE_CLASS
} from "./utils";

vi.mock("@open-pioneer/map", () => ({
    getScaleForPointResolution: vi.fn()
}));

describe("createBlockUserOverlay", () => {
    it("creates an overlay in the parent container", () => {
        const container = document.createElement("div");

        createBlockUserOverlay(container, "Printing is in progress");

        const overlay = container.querySelector(".printing-overlay");

        expect(overlay).not.toBeNull();
        expect(overlay?.parentElement).toBe(container);
        expect(overlay?.textContent).toBe("Printing is in progress");
        expect(overlay).toHaveClass("printing-overlay");
        expect(overlay).toHaveClass(PRINTING_HIDE_CLASS);
    });
});

describe("getPageSize", () => {
    it("returns portrait dimension", () => {
        const result = getPageSize("a5", "portrait");

        expect(result.paperHeight).toBeGreaterThan(result.paperWidth);
    });

    it("returns landscape dimension", () => {
        const result = getPageSize("a3", "landscape");

        expect(result.paperWidth).toBeGreaterThan(result.paperHeight);
    });
});

describe("getViewPadding", () => {
    it("returns zero padding when no padding is configured for the view", () => {
        const olView = { padding: undefined } as OlView;

        expect(getViewPadding(olView)).toEqual({
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        });
    });

    it("returns the padding of the view if set", () => {
        const olView = {
            padding: [10, 20, 30, 40]
        } as OlView;

        expect(getViewPadding(olView)).toEqual({
            top: 10,
            right: 20,
            bottom: 30,
            left: 40
        });
    });
});

describe("getMapCenterPixel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("calculates the center pixel of the map without offset when no padding is set", async () => {
        const olMap = {
            getSize: vi.fn().mockReturnValue([800, 600]),
            getView: vi.fn().mockReturnValue({ padding: [0, 0, 0, 0] } as OlView)
        };

        const center = getMapCenterPixel(olMap as never);

        expect(center).toEqual([400, 300]);
    });

    it("considers padding when calculating the center pixel of the map", async () => {
        const olMap = {
            getSize: vi.fn().mockReturnValue([1000, 800]),
            getView: vi.fn().mockReturnValue({ padding: [100, 200, 50, 80] } as OlView)
        };

        const center = getMapCenterPixel(olMap as never);

        expect(center).toEqual([440, 425]);
    });

    it("returns undefined when the map size is zero", async () => {
        const olMap = {
            getSize: vi.fn().mockReturnValue([0, 500]),
            getView: vi.fn().mockReturnValue({} as OlView)
        };

        const center = getMapCenterPixel(olMap as never);

        expect(center).toBeUndefined();
    });

    it("returns undefined when the map size is undefined", async () => {
        const olMap = {
            getSize: vi.fn().mockReturnValue(undefined)
        };

        const center = getMapCenterPixel(olMap as never);

        expect(center).toBeUndefined();
    });
});

// TODO does not work due to missing canvas implementation
// TODO use https://github.com/wobsoriano/vitest-canvas-mock ?
describe.skip("drawPrintArea", () => {
    const overlayColor = [0, 5, 25, 0.7];
    const transparent = [0, 0, 0, 0];

    let context: CanvasRenderingContext2D;

    beforeEach(() => {
        vi.clearAllMocks();

        context = {
            canvas: {
                width: 800,
                height: 600
            },
            getImageData: vi.fn(),
            lineTo: vi.fn(),
            moveTo: vi.fn(),
            reset: vi.fn(),
            save: vi.fn(),
            beginPath: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            restore: vi.fn()
        } as unknown as CanvasRenderingContext2D;

        Object.defineProperty(context, "fillStyle", {
            set: vi.fn()
        });
    });

    it("covers the canvas with a gray overlay except for the print area in the center (hole)", () => {
        const printArea = [100, 80, 400, 300];

        drawPrintArea(context, printArea);

        // check if outer bounds of overlay are gray
        expect(context.getImageData(0, 0, 1, 1).data).toEqual(overlayColor);
        expect(context.getImageData(context.canvas.width, 0, 1, 1).data).toEqual(overlayColor);
        expect(context.getImageData(0, context.canvas.height, 1, 1).data).toEqual(overlayColor);
        expect(
            context.getImageData(context.canvas.width, context.canvas.height, 1, 1).data
        ).toEqual(overlayColor);

        // check if inner bounds of overlay are gray
        expect(context.getImageData(100 - 1, 80 - 1, 1, 1).data).toEqual(overlayColor);
        expect(context.getImageData(100 - 1, 300 + 1, 1, 1).data).toEqual(overlayColor);
        expect(context.getImageData(400 + 1, 80 - 1, 1, 1).data).toEqual(overlayColor);
        expect(context.getImageData(400 + 1, 300 + 1, 1, 1).data).toEqual(overlayColor);

        // check if outer bounds of hole are transparent
        expect(context.getImageData(100, 80, 1, 1).data).toEqual(transparent);
        expect(context.getImageData(100, 300, 1, 1).data).toEqual(transparent);
        expect(context.getImageData(400, 80, 1, 1).data).toEqual(transparent);
        expect(context.getImageData(400, 300, 1, 1).data).toEqual(transparent);
    });

    it("does not draw any gray overlay when print area is larger than canvas", () => {
        const printArea = [
            context.canvas.width - 1,
            context.canvas.height - 1,
            context.canvas.width + 1,
            context.canvas.height + 1
        ];

        drawPrintArea(context, printArea);

        // check if outer bounds of overlay are transparent
        expect(context.getImageData(0, 0, 1, 1).data).toEqual(transparent);
        expect(context.getImageData(context.canvas.width, 0, 1, 1).data).toEqual(transparent);
        expect(context.getImageData(0, context.canvas.height, 1, 1).data).toEqual(transparent);
        expect(
            context.getImageData(context.canvas.width, context.canvas.height, 1, 1).data
        ).toEqual(transparent);

        // check if center is transparent
        expect(
            context.getImageData(context.canvas.width / 2, context.canvas.height / 2, 1, 1).data
        ).toEqual(overlayColor);
    });
});

describe("drawRectangle", () => {
    let context: CanvasRenderingContext2D;

    beforeEach(() => {
        vi.clearAllMocks();

        context = {
            canvas: {
                width: 800,
                height: 600
            },
            moveTo: vi.fn(),
            lineTo: vi.fn()
        } as unknown as CanvasRenderingContext2D;

        Object.defineProperty(context, "fillStyle", {
            set: vi.fn()
        });
    });

    it("draws a rectangle clockwise by default", () => {
        drawRectangle(context, [10, 20, 100, 200]);

        expect(context.moveTo).toHaveBeenCalledTimes(1);
        expect(context.moveTo).toHaveBeenCalledWith(10, 20);

        expect(context.lineTo).toHaveBeenCalledTimes(3);
        expect(context.lineTo).toHaveBeenNthCalledWith(1, 100, 20);
        expect(context.lineTo).toHaveBeenNthCalledWith(2, 100, 200);
        expect(context.lineTo).toHaveBeenNthCalledWith(3, 10, 200);
    });

    it("draws a rectangle anti-clockwise when reversed", () => {
        drawRectangle(context, [10, 20, 100, 200], true);

        expect(context.moveTo).toHaveBeenCalledWith(10, 20);

        expect(context.lineTo).toHaveBeenCalledTimes(3);
        expect(context.lineTo).toHaveBeenNthCalledWith(1, 10, 200);
        expect(context.lineTo).toHaveBeenNthCalledWith(2, 100, 200);
        expect(context.lineTo).toHaveBeenNthCalledWith(3, 100, 20);
    });
});

describe("getPixelBounds", () => {
    const pageFormat: PageFormatType = "a4";
    const orientation: PageOrientationType = "landscape";
    const scale = 5000;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns pixel bounds centered around the map center", () => {
        const olMap = {
            getSize: vi.fn().mockReturnValue([1000, 800]),
            getView: vi.fn().mockReturnValue({ padding: [10, 20, 30, 40] } as OlView)
        };
        const map = {
            olMap,
            getCenterPointResolution: vi.fn().mockReturnValue(2)
        } as unknown as MapModel;

        const result = getPixelBounds(map, pageFormat, orientation, scale);

        expect(result).toEqual([139, 128, 882, 653]);
    });

    it("returns undefined when no screen size can be calculated due to undefined center point resolution", () => {
        const olMap = {
            getSize: vi.fn().mockReturnValue([1000, 800]),
            getView: vi.fn().mockReturnValue({ padding: [10, 20, 30, 40] } as OlView)
        };
        const map = {
            olMap,
            getCenterPointResolution: vi.fn().mockReturnValue(undefined)
        } as unknown as MapModel;

        const result = getPixelBounds(map, pageFormat, orientation, scale);

        expect(result).toBeUndefined();
    });

    it("returns undefined when the map size is undefined", () => {
        const olMap = {
            getSize: vi.fn().mockReturnValue(undefined),
            getView: vi.fn().mockReturnValue({ padding: [10, 20, 30, 40] } as OlView)
        };
        const map = {
            olMap,
            getCenterPointResolution: vi.fn().mockReturnValue(undefined)
        } as unknown as MapModel;

        const result = getPixelBounds(map, pageFormat, orientation, scale);

        expect(result).toBeUndefined();
    });
});

describe("getScreenSizeForPageSize", () => {
    const pageSize: PageSize = {
        paperWidth: 210,
        paperHeight: 297
    } as PageSize;

    const createMap = (centerPointResolution: number | undefined): MapModel =>
        ({
            getCenterPointResolution: vi.fn().mockReturnValue(centerPointResolution)
        }) as unknown as MapModel;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns undefined when the map has no center point resolution", () => {
        const map = createMap(undefined);

        const result = getScreenSizeForPageSize(map, pageSize, 25000);

        expect(result).toBeUndefined();
    });

    it("calculates the screen size using the provided scale", () => {
        const map = createMap(2);

        const result = getScreenSizeForPageSize(map, pageSize, 25000);

        expect(result).toEqual({
            pixelWidth: 2625, // 210 mm * 25.000 / 1.000 mm/m = 5.250 m; 5.250 m / 2 m/px = 2.625 px
            pixelHeight: 3713 // 297 mm * 25.000 / 1.000 mm/m = 7.425 m; 7.425 m / 2 m/px = 3.712,5 px
        });
    });

    it("uses the scale calculated for the target DPI when targetDpi is provided", () => {
        const map = createMap(2);

        vi.mocked(getScaleForPointResolution).mockReturnValue(10000);

        const result = getScreenSizeForPageSize(map, pageSize, 25000, 300);

        expect(getScaleForPointResolution).toHaveBeenCalledWith({
            pointResolution: 2,
            dpi: 300
        });

        expect(result).toEqual({
            pixelWidth: 1050, // 210 mm * 10.000 / 1.000 mm/m = 2.100 m; 2.100 m / 2 m/px = 1.050 px
            pixelHeight: 1485 // 297 mm * 10.000 / 1.000 mm/m = 2.970 m; 2.970 m / 2 m/px = 1.485 px
        });
    });
});
