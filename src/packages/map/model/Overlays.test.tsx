// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, waitFor } from "@testing-library/react";
import { MapContainer } from "../ui/MapContainer";
import { Overlays } from "./Overlays";
import { expect, it } from "vitest";
import { Box } from "@chakra-ui/react";
import BaseEvent from "ol/events/Event";

it("return all current overlays", async () => {
    const { overlays } = await setup();
    const testClassName = "overlay-test";

    expect(overlays.getOverlays().length).toBe(0);

    const overlay1 = overlays.addOverlay({
        content: "overlay 1",
        className: testClassName
    });
    expect(overlays.getOverlays().length).toBe(1);
    expect(overlays.getOverlays()).toContain(overlay1);

    const overlay2 = overlays.addOverlay({
        content: "overlay 2",
        className: testClassName
    });
    expect(overlays.getOverlays().length).toBe(2);
    expect(overlays.getOverlays()).toContain(overlay1);
    expect(overlays.getOverlays()).toContain(overlay2);

    overlay2.destroy();
    overlay1.destroy();
    expect(overlays.getOverlays().length).toBe(0);
});

it("render an Overlay with simple text content", async () => {
    const { overlays } = await setup();
    const overlayTextContent = "Overlay Text Content";
    const testClassName = "overlay-test";

    overlays.addOverlay({
        content: overlayTextContent,
        className: testClassName
    });
    const element = getOverlayDivElement(overlays, testClassName);

    await waitFor(() => expect(element.innerHTML).toEqual(overlayTextContent));
});

it("reset content of an Overlay", async () => {
    const { overlays } = await setup();
    const overlayTextContent1 = "Overlay Text Content 1";
    const overlayTextContent2 = "Overlay Text Content 2";
    const testClassName = "overlay-test";

    const overlay = overlays.addOverlay({
        content: overlayTextContent1,
        className: testClassName
    });
    const element = getOverlayDivElement(overlays, testClassName);
    await waitFor(() => expect(element.innerHTML).toEqual(overlayTextContent1));

    overlay.setContent(overlayTextContent2);
    await waitFor(() => expect(element.innerHTML).toEqual(overlayTextContent2));
});

it("render an Overlay with react component as content", async () => {
    const { overlays } = await setup();
    const overlayTextContent = "Overlay Text Content";
    const testClassName = "overlay-test";

    overlays.addOverlay({
        content: <DummyOverlayContent innerText={overlayTextContent}></DummyOverlayContent>,
        className: testClassName
    });
    const element = getOverlayDivElement(overlays, testClassName);

    await waitFor(() => expect(element.innerHTML).toEqual(`<span>${overlayTextContent}</span>`));
});

it("render overlay at fixed position", async () => {
    const { overlays } = await setup();
    const overlayTextContent = "Overlay Text Content";
    const testClassName = "overlay-test";

    const overlay = overlays.addOverlay({
        content: overlayTextContent,
        className: testClassName,
        position: [50, 50]
    });
    //use underlying ol overlay to check coordinate
    const olOverlay = overlay.olOverlay;
    expect(olOverlay.getPosition()).toEqual([50, 50]);

    overlay.setPosition([40, 40]);
    expect(olOverlay.getPosition()).toEqual([40, 40]);
});

it("set overlay position according to pointer position (mode: followPointer)", async () => {
    const { map, overlays } = await setup();
    const overlayTextContent = "Overlay Text Content";
    const testClassName = "overlay-test";
    const expectedPosition1 = [777000, 6698400];
    const expectedPosition2 = [777500, 669900];

    const overlay = overlays.addOverlay({
        content: overlayTextContent,
        className: testClassName,
        mode: "followPointer"
    });

    const simulateMove = (x: number, y: number) => {
        const fakeMoveEvent = new BaseEvent("pointermove");
        (fakeMoveEvent as any).coordinate = [x, y];
        map.olMap.dispatchEvent(fakeMoveEvent);
    };
    //fake pointer move
    act(() => {
        simulateMove(expectedPosition1[0]!, expectedPosition1[1]!);
    });
    expect(overlay.position).toEqual(expectedPosition1);

    act(() => {
        simulateMove(expectedPosition2[0]!, expectedPosition2[1]!);
    });
    expect(overlay.position).toEqual(expectedPosition2);
});

it("add class name to overlay element", async () => {
    const { overlays } = await setup();
    const overlayTextContent = "Overlay Text Content";
    const testClassName1 = "overlay-test";
    const testClassName2 = "overlay-test2";

    const overlay = overlays.addOverlay({
        content: overlayTextContent,
        className: testClassName1
    });

    const overlayElement = getOverlayDivElement(overlays, testClassName1);
    expect(overlayElement.className).toEqual(testClassName1);

    overlay.setClassName(testClassName2);
    expect(overlayElement.className).toEqual(testClassName2);
});

it("add role to overlay element", async () => {
    const { overlays } = await setup();
    const overlayTextContent = "Overlay Text Content";
    const testClassName = "overlay-test";
    const role1 = "abc";
    const role2 = "xyz";

    const overlay = overlays.addOverlay({
        content: overlayTextContent,
        className: testClassName,
        ariaRole: role1
    });

    const overlayElement = getOverlayDivElement(overlays, testClassName);
    expect(overlayElement.role).toEqual(role1);

    overlay.setAriaRole(role2);
    expect(overlayElement.role).toEqual(role2);
});

it("set offset and positioning correctly", async () => {
    const { overlays } = await setup();
    const overlayTextContent = "Overlay Text Content";
    const testClassName = "overlay-test";

    const overlay = overlays.addOverlay({
        content: overlayTextContent,
        className: testClassName,
        positioning: "bottom-center",
        offset: [0, 0]
    });

    //use underlying ol overlay for checks
    const olOverlay = overlay.olOverlay;
    expect(olOverlay.getPositioning()).toEqual("bottom-center");
    expect(olOverlay.getOffset()).toEqual([0, 0]);

    overlay.setPositioning("top-center");
    overlay.setOffset([10, 10]);
    expect(olOverlay.getPositioning()).toEqual("top-center");
    expect(olOverlay.getOffset()).toEqual([10, 10]);
});

it("overlay is destroyed after calling destroy function", async () => {
    const { overlays } = await setup();
    const overlayTextContent = "Overlay Text Content";
    const testClassName = "overlay-test";

    const overlay = overlays.addOverlay({
        content: overlayTextContent,
        className: testClassName
    });

    expect(overlay.isDestroyed).toBeFalsy();

    overlay.destroy();
    expect(overlay.isDestroyed).toBeTruthy();
});

it("overlay is inside OL's container that stops event propagation if stopEvent is true", async () => {
    const { overlays } = await setup();
    const overlayTextContent = "Overlay Text Content";
    const testClassName = "overlay-test";
    const olStopEventContainerSelector = ".ol-overlaycontainer-stopevent";

    overlays.addOverlay({
        content: overlayTextContent,
        className: testClassName,
        stopEvent: true
    });

    const overlayElement = getOverlayDivElement(overlays, testClassName);
    //find container element, not necessarily direct parent
    const parentContainer = overlayElement.closest(olStopEventContainerSelector);
    expect(parentContainer).not.toBe(null);
});

async function setup() {
    const { map } = await setupMap();

    render(
        <PackageContextProvider>
            <MapContainer map={map} data-testid="base"></MapContainer>
        </PackageContextProvider>
    );

    await waitForMapMount();

    const overlays = map.overlays;

    return { map, overlays };
}

function getOverlayDivElement(overlays: Overlays, expectedClassname: string): HTMLDivElement {
    const allOverlays = overlays.getOverlays();
    const tooltips = allOverlays.filter((overlay) => {
        const overlayClassname = overlay.className;
        return overlayClassname.includes(expectedClassname);
    });
    if (tooltips.length === 0) {
        throw Error("did not find any overlays");
    }
    const element = tooltips[0]!.olOverlay.getElement();
    if (!element) {
        throw new Error("overlay did not have an element");
    }

    if (element instanceof HTMLDivElement) {
        return element;
    } else {
        throw new Error("overlay element is not a div");
    }
}

export function DummyOverlayContent(props: { innerText: string }) {
    const { innerText } = props;

    return <Box as="span">{innerText}</Box>;
}
