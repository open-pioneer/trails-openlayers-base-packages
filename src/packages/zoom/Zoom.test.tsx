// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import userEvent from "@testing-library/user-event";
import { Zoom, ZoomIn, ZoomOut } from "./Zoom";

it("should successfully create a zoom-in and zoom-out buttons", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <ZoomIn mapId={mapId} data-testid="zoom-in" />
            <ZoomOut mapId={mapId} data-testid="zoom-out" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    // check zoom buttons are available
    const zoomInButton = await screen.findByTestId("zoom-in");
    expect(zoomInButton).toBeInstanceOf(HTMLButtonElement);
    expect(zoomInButton).toMatchSnapshot();

    const zoomOutButton = await screen.findByTestId("zoom-out");
    expect(zoomOutButton).toBeInstanceOf(HTMLButtonElement);
    expect(zoomOutButton).toMatchSnapshot();
});

it("should successfully create a zoom component with additional css classes", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <Zoom
                data-testid="zoom"
                mapId={mapId}
                className="testClass1 testClass2"
                zoomDirection="in"
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    // zoom is mounted
    const zoomButton = await screen.findByTestId("zoom");
    expect(zoomButton).toMatchSnapshot();
    expect(zoomButton.classList.contains("testClass1")).toBe(true);
    expect(zoomButton.classList.contains("testClass2")).toBe(true);
    expect(zoomButton.classList.contains("testClass3")).toBe(false);
});

it("should zoom in and zoom out when clicked", async () => {
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const user = userEvent.setup();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <ZoomIn data-testid="zoom-in" mapId={mapId} />
            <ZoomOut data-testid="zoom-out" mapId={mapId} />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    const zoomInButton = await screen.findByTestId<HTMLButtonElement>("zoom-in");
    const zoomOutButton = await screen.findByTestId<HTMLButtonElement>("zoom-out");

    let oldZoom: number | undefined = map.olMap.getView().getZoom();
    let newZoom: number | undefined;

    await user.click(zoomInButton);
    await waitFor(() => {
        newZoom = map.olMap.getView().getZoom();
        if (oldZoom === undefined || newZoom === undefined) {
            throw new Error("zoom level is undefined");
        } else {
            expect(newZoom).toBe(oldZoom + 1);
        }
    });

    oldZoom = newZoom;

    await user.click(zoomOutButton);
    await waitFor(() => {
        newZoom = map.olMap.getView().getZoom();
        if (oldZoom === undefined || newZoom === undefined) {
            throw new Error("zoom level is undefined");
        } else {
            expect(newZoom).toBe(oldZoom - 1);
        }
    });
});
