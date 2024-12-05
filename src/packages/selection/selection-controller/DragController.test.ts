// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, vi, it } from "vitest";
import { DragController } from "./DragController";
import OlMap from "ol/Map";

afterEach(() => {
    vi.restoreAllMocks();
});

it("expect tooltip to be successfully created after construction", async () => {
    const { olMap, tooltipTest } = createController();
    const activeTooltip = getTooltipElement(olMap, "selection-tooltip");
    expect(activeTooltip).toMatchSnapshot(tooltipTest);
});

it("expect extent handler to be called", async () => {
    const { controller, extentHandler } = createController();
    const dragBox = controller.getDragboxInteraction();
    if (!dragBox) throw new Error("myDragbox not found");
    dragBox.interaction.dispatchEvent("boxend");
    expect(extentHandler).toBeCalledTimes(1);
});

it("expect interactions, tooltip and cursor correspond to controller state", async () => {
    const { olMap, controller, tooltipTest, disabledTooltipText } = createController();
    const activeTooltip = getTooltipElement(olMap, "selection-tooltip");

    const dragBox = controller.getDragboxInteraction()?.interaction;
    const dragPan = controller.getDragPanInteraction()?.interaction;

    if (dragBox === undefined || dragPan === undefined)
        throw new Error("at least one interaction not found");

    expect(olMap.getInteractions().getArray()).contains(dragBox);
    expect(olMap.getInteractions().getArray()).contains(dragPan);
    expect(olMap.getViewport().classList.contains("selection-active")).toBeTruthy();
    expect(activeTooltip.textContent).toBe(tooltipTest);

    controller.setActive(false);

    expect(olMap.getInteractions().getArray()).not.contains(dragBox);
    expect(olMap.getInteractions().getArray()).not.contains(dragPan);
    expect(olMap.getViewport().classList.contains("selection-inactive")).toBeTruthy();
    expect(activeTooltip.textContent).toBe(disabledTooltipText);
});

function createController() {
    const olMap = new OlMap();
    const tooltipTest = "Tooltip wurde gesetzt";
    const disabledTooltipText = "Funktion ist deaktiviert";
    const extentHandler = vi.fn();
    const controller = new DragController(olMap, tooltipTest, disabledTooltipText, extentHandler);
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
