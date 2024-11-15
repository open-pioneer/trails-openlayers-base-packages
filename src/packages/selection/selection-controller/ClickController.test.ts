// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, vi, it } from "vitest";
import OlMap from "ol/Map";
import { ClickController } from "./ClickController";
import { LineString, Polygon } from "ol/geom";

afterEach(() => {
    vi.restoreAllMocks();
});

it("expect tooltip to be successfully created after construction", async () => {
    const { olMap, tooltipTest } = createController();
    const activeTooltip = getTooltipElement(olMap, "selection-tooltip");
    expect(activeTooltip).toMatchSnapshot(tooltipTest);
});

it("expect event handler function to call extentHandler with a polygon", async () => {
    const { controller, extentHandler } = createController();
    controller.olMap.getPixelFromCoordinate = (coordinate) => coordinate;
    controller.olMap.getCoordinateFromPixel = (pixel) => pixel;
    const evt = {
        coordinate: [0, 0],
    };
    controller.onClick(evt as any);
    expect(extentHandler).toBeCalledTimes(1);
    expect(extentHandler).toBeCalledWith(expect.any(Polygon));
});


function createController() {
    const olMap = new OlMap();
    const tooltipTest = "Tooltip wurde gesetzt";
    const disabledTooltipText = "Funktion ist deaktiviert";
    const extentHandler = vi.fn();
    const controller = new ClickController(olMap, tooltipTest, disabledTooltipText, extentHandler);
    return { olMap, controller, tooltipTest, extentHandler, disabledTooltipText };
}

function getTooltipElement(olMap: OlMap, className: string): HTMLElement {
    const allOverlays = olMap.getOverlays().getArray();
    const tooltips = allOverlays.filter((ol) => ol.getElement()?.classList.contains(className));
    if (tooltips.length === 0) {
        throw Error("did not find any tooltips");
    }
    const element = tooltips[0]!.getElement();
    if (!element) {
        throw new Error("tooltip overlay did not have an element");
    }
    return element;
}
