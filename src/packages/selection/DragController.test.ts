// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, vi, it } from "vitest";
import { DragController } from "./DragController";
import { waitFor } from "@testing-library/react";
import { setupMap } from "@open-pioneer/map-test-utils";
import { MapModel } from "@open-pioneer/map";

afterEach(() => {
    vi.restoreAllMocks();
});

it.only("expect tooltip to be successfully created after construction", async () => {
    const { map, tooltipTest } = await createController();
    const activeTooltip = getTooltipElement(map, "selection-tooltip");
    await waitFor(() => expect(activeTooltip.textContent).not.toEqual(""));
});

it("expect extent handler to be called", async () => {
    const { controller, extentHandler } = await createController();
    const dragBox = controller.getDragboxInteraction();
    if (!dragBox) throw new Error("myDragbox not found");
    dragBox.interaction.dispatchEvent("boxend");
    expect(extentHandler).toBeCalledTimes(1);
});

it("expect interactions, tooltip and cursor correspond to controller state", async () => {
    const { map, olMap, controller, tooltipTest, disabledTooltipText } = await createController();
    const activeTooltip = getTooltipElement(map, "selection-tooltip");

    const dragBox = controller.getDragboxInteraction()?.interaction;
    const dragPan = controller.getDragPanInteraction()?.interaction;

    if (dragBox === undefined || dragPan === undefined)
        throw new Error("at least one interaction not found");

    await waitFor(() => {
        expect(olMap.getInteractions().getArray()).contains(dragBox);
        expect(olMap.getInteractions().getArray()).contains(dragPan);
        expect(olMap.getViewport().classList.contains("selection-active")).toBeTruthy();
    });
    expect(activeTooltip.textContent).toBe(tooltipTest);

    controller.setActive(false);

    await waitFor(() => {
        expect(olMap.getInteractions().getArray()).not.contains(dragBox);
        expect(olMap.getInteractions().getArray()).not.contains(dragPan);
        expect(olMap.getViewport().classList.contains("selection-inactive")).toBeTruthy();
    });
    expect(activeTooltip.textContent).toBe(disabledTooltipText);
});

async function createController() {
    const { map } = await setupMap();

    const olMap = map.olMap;
    const tooltipTest = "Tooltip wurde gesetzt";
    const disabledTooltipText = "Funktion ist deaktiviert";
    const extentHandler = vi.fn();
    const controller = new DragController(map, tooltipTest, disabledTooltipText, extentHandler);
    return { map, olMap, controller, tooltipTest, extentHandler, disabledTooltipText };
}

function getTooltipElement(map: MapModel, expectedClassname: string): HTMLElement {
    const allOverlays = map.overlays.getOverlays();
    const tooltips = allOverlays.filter((overlay) => {
        const overlayClassname = overlay.className;
        return overlayClassname.includes(expectedClassname);
    });
    if (tooltips.length === 0) {
        throw Error("did not find any tooltips");
    }
    const element = tooltips[0]!.olOverlay.getElement();
    if (!element) {
        throw new Error("tooltip overlay did not have an element");
    }
    return element;
}
