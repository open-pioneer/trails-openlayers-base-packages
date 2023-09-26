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
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <ZoomIn mapId={mapId} data-testid="zoom-in" />
                <ZoomOut mapId={mapId} data-testid="zoom-out" />
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    // check zoom buttons are available
    const zoomIn = await screen.findByTestId("zoom-in");
    const zoomInButton = zoomIn.querySelectorAll(".zoom-button.zoom-in");
    expect(zoomInButton.length).toBe(1);
    expect(zoomInButton[0]).toBeInstanceOf(HTMLButtonElement);
    expect(zoomIn).toMatchSnapshot();

    const zoomOut = await screen.findByTestId("zoom-out");
    const zoomOutButton = zoomOut.querySelectorAll(".zoom-button.zoom-out");
    expect(zoomOutButton.length).toBe(1);
    expect(zoomOutButton[0]).toBeInstanceOf(HTMLButtonElement);
    expect(zoomOut).toMatchSnapshot();
});

it("should successfully create a zoom component with additional css classes", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <Zoom
                    data-testid="zoom"
                    mapId={mapId}
                    className="testClass1 testClass2"
                    zoomDirection="in"
                />
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    // zoom is mounted
    const zoomDiv = await screen.findByTestId("zoom");
    expect(zoomDiv).toMatchSnapshot();
    expect(zoomDiv.classList.contains("testClass1")).toBe(true);
    expect(zoomDiv.classList.contains("testClass2")).toBe(true);
    expect(zoomDiv.classList.contains("testClass3")).toBe(false);
});

it("should zoom in and zoom out when clicked", async () => {
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const user = userEvent.setup();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <ZoomIn data-testid="zoom-in" mapId={mapId} />
                <ZoomOut data-testid="zoom-out" mapId={mapId} />
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    const zoomIn = await screen.findByTestId("zoom-in");
    const zoomOut = await screen.findByTestId("zoom-out");

    const zoomInButton = zoomIn.querySelector(".zoom-button") as HTMLButtonElement;
    const zoomOutButton = zoomOut.querySelector(".zoom-button") as HTMLButtonElement;

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
