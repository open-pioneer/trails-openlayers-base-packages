// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { get } from "ol/proj";
import { ScaleViewer } from "./ScaleViewer";
import View from "ol/View";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";

it("should successfully create a scale viewer component", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <div data-testid="base">
                <ScaleViewer mapId={mapId}></ScaleViewer>
            </div>
        </PackageContextProvider>
    );

    // scale viewer is mounted
    const { viewerDiv, viewerText } = await waitForScaleViewer();
    expect(viewerDiv).toMatchSnapshot();

    // check scale viewer box is available
    expect(viewerText).toBeInstanceOf(HTMLParagraphElement);
});

it("should successfully create a scale viewer component with additional css classes and box properties", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <div data-testid="base">
                <ScaleViewer mapId={mapId} className="test test1 test2" pl="1px" />
            </div>
        </PackageContextProvider>
    );

    // scale viewer is mounted
    const { viewerDiv } = await waitForScaleViewer();
    expect(viewerDiv).toMatchSnapshot();

    // check scale viewer box is available
    if (!viewerDiv) {
        throw new Error("scale text not rendered");
    } else {
        expect(viewerDiv).toBeInstanceOf(HTMLDivElement);
        expect(viewerDiv.classList.contains("test")).toBe(true);
        expect(viewerDiv.classList.contains("test1")).toBe(true);
        expect(viewerDiv.classList.contains("test2")).toBe(true);
        expect(viewerDiv.classList.contains("test3")).not.toBe(true);

        const styles = window.getComputedStyle(viewerDiv);
        expect(styles.paddingLeft).toBe("1px");
    }
});

it("should successfully render the scale in the correct locale", async () => {
    const center = [847541, 6793584];
    const resolution = 9.554628535647032;
    const projection = get("EPSG:3857");
    if (!projection) {
        throw new Error("projection not found");
    }

    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const olMap = map.olMap;
    olMap.setView(
        new View({
            center,
            resolution,
            projection
        })
    );

    const injectedServices = createServiceOptions({ registry });
    const result = render(
        <PackageContextProvider services={injectedServices} locale="en">
            <div data-testid="base">
                <ScaleViewer mapId={mapId} />
            </div>
        </PackageContextProvider>
    );

    const { viewerText } = await waitForScaleViewer();
    expect(viewerText.textContent).toBe("1:21,026");

    result.rerender(
        <PackageContextProvider services={injectedServices} locale="de">
            <div data-testid="base">
                <ScaleViewer mapId={mapId} />
            </div>
        </PackageContextProvider>
    );
    expect(viewerText.textContent).toBe("1:21.026");
});

async function waitForScaleViewer() {
    const { viewerDiv, viewerText } = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");

        const viewerDiv = domElement.querySelector(".scale-viewer");
        if (!viewerDiv) {
            throw new Error("scale viewer not rendered");
        }

        const viewerText = domElement.querySelector("p"); // find first HTMLParagraphElement (scale text) in scale viewer component
        if (!viewerText) {
            throw new Error("scale text not rendered");
        }

        return { viewerDiv, viewerText };
    });

    return { viewerDiv, viewerText };
}
