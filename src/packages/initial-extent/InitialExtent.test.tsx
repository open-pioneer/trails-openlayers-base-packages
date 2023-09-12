// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment happy-dom
 */
import { MapContainer } from "@open-pioneer/map";
import {
    createPackageContextProviderProps,
    setupMap,
    waitForMapMount
} from "@open-pioneer/map/test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OlMap from "ol/Map";
import { expect, it } from "vitest";
import { InitialExtent } from "./InitialExtent";

// used to avoid a "ResizeObserver is not defined" error
import { Extent, equals } from "ol/extent";
import ResizeObserver from "resize-observer-polyfill";
global.ResizeObserver = ResizeObserver;

it("should successfully create a initial extent component with home button", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <InitialExtent mapId={mapId}></InitialExtent>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    //mount InitExtentComponent
    const { initExtentDiv } = await waitForInitExtentComponent();
    expect(initExtentDiv).toMatchSnapshot();

    const initExtentBtn = initExtentDiv.querySelectorAll(".initial-extent-button");
    expect(initExtentBtn.length).toBe(1);
    expect(initExtentBtn[0]).toBeInstanceOf(HTMLButtonElement);
});

it("should successfully create a initial extent component with additional css classes", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <InitialExtent mapId={mapId} className="testClass1 testClass2"></InitialExtent>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    //mount InitExtentComponent
    const { initExtentDiv } = await waitForInitExtentComponent();
    expect(initExtentDiv).toMatchSnapshot();

    expect(initExtentDiv.classList.contains("testClass1")).toBe(true);
    expect(initExtentDiv.classList.contains("testClass2")).toBe(true);
});

it("should successfully click the home button and go to initial extent", async () => {
    const { mapId, registry } = await setupMap();
    const user = userEvent.setup();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="map" style={{ height: "500px", width: "500px" }}>
                <MapContainer mapId={mapId} />
            </div>
            <div data-testid="base">
                <InitialExtent mapId={mapId}></InitialExtent>
            </div>
        </PackageContextProvider>
    );
    await waitForMapMount("map");

    //mount InitExtentComponent
    const { initExtentDiv } = await waitForInitExtentComponent();

    const mapModel = await registry.expectMapModel(mapId);
    await mapModel.whenDisplayed();
    if (!mapModel.initialExtent) {
        throw new Error("Initial extent not set");
    }

    const initExtentBtn = initExtentDiv.querySelector(
        ".initial-extent-button"
    ) as HTMLButtonElement;

    const currentExtent = () => getCurrentExtent(mapModel.olMap);

    // Store initial extent
    const extent1 = currentExtent();

    // Navigate somewhere else
    // const berlin = { xMin: 1489200, yMin: 6894026, xMax: 1489200, yMax: 6894026 };
    mapModel.olMap.getView().fit([1479200, 6884026, 1499200, 6897026]);
    expect(equals(extent1, currentExtent())).toBe(false);

    // Return to initial extent and wait for the animation to complete
    await act(async () => {
        await user.click(initExtentBtn);
        await waitForStableExtent(mapModel.olMap);
    });

    // Extent should be the same
    const extent2 = currentExtent();
    expect(equals(extent1, extent2)).toBe(true);
});

async function waitForInitExtentComponent() {
    const { domElement, initExtentDiv } = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const initExtentDiv = domElement.querySelector(".initial-extent");
        if (!initExtentDiv) {
            throw new Error("InitExtentComponent not rendered");
        }

        return { domElement, initExtentDiv };
    });
    return { domElement, initExtentDiv };
}

async function waitForStableExtent(olMap: OlMap) {
    let lastExtent: Extent | undefined = undefined;
    await waitFor(() => {
        const currentExtent = getCurrentExtent(olMap);
        if (lastExtent && equals(currentExtent, lastExtent)) {
            return;
        }

        lastExtent = currentExtent;
        throw new Error("Extent changed");
    });
}

function getCurrentExtent(olMap: OlMap) {
    const extent = olMap.getView().calculateExtent();
    if (!extent) {
        throw new Error("invalid extent");
    }
    return extent;
}
