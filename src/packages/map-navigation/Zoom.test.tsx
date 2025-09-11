// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import userEvent from "@testing-library/user-event";
import { Zoom, ZoomIn, ZoomOut } from "./Zoom";

it("should successfully create a zoom-in and zoom-out buttons", async () => {
    const { map } = await setupMap();

    render(
        <PackageContextProvider>
            <MapContainer map={map} data-testid="map" />
            <ZoomIn map={map} data-testid="zoom-in" />
            <ZoomOut map={map} data-testid="zoom-out" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    // check zoom buttons are available
    const zoomInButton = await screen.findByTestId("zoom-in");
    expect(zoomInButton.tagName).toBe("BUTTON");
    expect(zoomInButton).toMatchSnapshot();

    const zoomOutButton = await screen.findByTestId("zoom-out");
    expect(zoomOutButton.tagName).toBe("BUTTON");
    expect(zoomOutButton).toMatchSnapshot();
});

it("should successfully create a zoom component with additional css classes", async () => {
    const { map } = await setupMap();

    render(
        <PackageContextProvider>
            <MapContainer map={map} data-testid="map" />
            <Zoom
                data-testid="zoom"
                map={map}
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
    const { map } = await setupMap();
    const user = userEvent.setup();

    render(
        <PackageContextProvider>
            <MapContainer map={map} data-testid="map" />
            <ZoomIn data-testid="zoom-in" map={map} />
            <ZoomOut data-testid="zoom-out" map={map} />
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
