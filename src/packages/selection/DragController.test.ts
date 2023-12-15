// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, vi, it } from "vitest";
import { DragController } from "./DragController";
import OlMap from "ol/Map";
import { SelectionMethods } from "./Selection";

afterEach(() => {
    vi.restoreAllMocks();
});

it("Tooltip successfully create after construction", async () => {
    const { olMap, tooltipTest } = createController();
    const activeTooltip = getTooltipElement(olMap, "select-tooltip");
    expect(activeTooltip).toMatchSnapshot(tooltipTest);
});

it("Should drag a Extent", async () => {
    const { controller, extentHandler } = createController();
    const myDragbox = controller.getDragBox();
    if (!myDragbox) throw new Error("myDragbox not found");
    myDragbox.dragBox.dispatchEvent("boxend");
    expect(extentHandler).toBeCalledTimes(1);
});

function createController() {
    const olMap = new OlMap();
    const tooltipTest = "Tooltip wurde gesetzt";
    const disabledTooltipText = "Funktion ist deaktiviert";
    const extentHandler = vi.fn();
    const controller = new DragController(
        olMap,
        SelectionMethods.extent,
        tooltipTest,
        disabledTooltipText,
        extentHandler
    );
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
