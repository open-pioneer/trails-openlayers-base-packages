// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OlMap from "ol/Map";
import { Extent, equals } from "ol/extent";
import { expect, it } from "vitest";
import { InitialExtent } from "./InitialExtent";

it("should successfully create a initial extent component with home button", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <InitialExtent mapId={mapId} data-testid="initial-extent" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    //mount InitExtentComponent
    const initExtentBtn = await screen.findByTestId("initial-extent");
    expect(initExtentBtn.tagName).toBe("BUTTON");
    expect(initExtentBtn).toMatchSnapshot();
});

it("should successfully create a initial extent component with additional css classes", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <InitialExtent
                mapId={mapId}
                className="testClass1 testClass2"
                data-testid="initial-extent"
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    //mount InitExtentComponent
    const initialExtentButton = await screen.findByTestId("initial-extent");
    expect(initialExtentButton).toMatchSnapshot();

    expect(initialExtentButton.classList.contains("testClass1")).toBe(true);
    expect(initialExtentButton.classList.contains("testClass2")).toBe(true);
    expect(initialExtentButton.classList.contains("testClass3")).toBe(false);
});

it("should successfully click the home button and go to initial extent", async () => {
    const { mapId, registry } = await setupMap();
    const user = userEvent.setup();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <InitialExtent mapId={mapId} data-testid="initial-extent"></InitialExtent>
        </PackageContextProvider>
    );
    await waitForMapMount("map");

    //mount InitExtentComponent
    const initialExtentButton = await screen.findByTestId("initial-extent");

    const mapModel = await registry.expectMapModel(mapId);
    await mapModel.whenDisplayed();
    if (!mapModel.initialExtent) {
        throw new Error("Initial extent not set");
    }

    const currentExtent = () => getCurrentExtent(mapModel.olMap);

    // Store initial extent
    const firstExtent = currentExtent();

    // Set new map extent
    mapModel.olMap.getView().fit([1479200, 6884026, 1499200, 6897026]);
    expect(equals(firstExtent, currentExtent())).toBe(false);

    // Return to initial extent and wait for the animation to complete
    await act(async () => {
        await user.click(initialExtentButton);
        await waitForStableExtent(mapModel.olMap);
    });

    const nextExtent = currentExtent();
    expect(equals(firstExtent, nextExtent)).toBe(true);
});

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
