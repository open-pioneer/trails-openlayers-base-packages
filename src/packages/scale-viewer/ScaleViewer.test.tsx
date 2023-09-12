// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { ScaleViewer } from "./ScaleViewer";
import { createPackageContextProviderProps, setupMap } from "@open-pioneer/map/test-utils";

it("should successfully create a scale viewer component", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
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

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
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
