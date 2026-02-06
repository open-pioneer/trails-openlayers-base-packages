// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { MapContainer } from "../ui/MapContainer";
import { Overlays } from "./Overlays";
import { expect, it } from "vitest";
import { Box } from "@chakra-ui/react";

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

async function setup() {
    const { map } = await setupMap();
    render(
        createElement(
            PackageContextProvider,
            {},
            createElement(MapContainer, { map, "data-testid": "base" })
        )
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
        throw Error("did not find any tooltips");
    }
    const element = tooltips[0]!.olOverlay.getElement();
    if (!element) {
        throw new Error("tooltip overlay did not have an element");
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
