// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import userEvent from "@testing-library/user-event";
import { Zoom } from "./Zoom";

it("should successfully create a zoom component with a zoom in and a zoom out button", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <Zoom mapId={mapId}></Zoom>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    // zoom is mounted
    const { zoomDiv } = await waitForZoom();
    expect(zoomDiv).toMatchSnapshot();

    // check zoom buttons are available
    const zoomInButton = zoomDiv.querySelectorAll(".btn-zoom-in");
    expect(zoomInButton.length).toBe(1);
    expect(zoomInButton[0]).toBeInstanceOf(HTMLButtonElement);

    const zoomOutButton = zoomDiv.querySelectorAll(".btn-zoom-out");
    expect(zoomOutButton.length).toBe(1);
    expect(zoomOutButton[0]).toBeInstanceOf(HTMLButtonElement);
});

it("should successfully create a zoom component with additional css classes", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <Zoom mapId={mapId} className="testClass1 testClass2"></Zoom>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    // zoom is mounted
    const { zoomDiv } = await waitForZoom();
    expect(zoomDiv).toMatchSnapshot();

    expect(zoomDiv.classList.contains("testClass1")).toBe(true);
    expect(zoomDiv.classList.contains("testClass2")).toBe(true);
    expect(zoomDiv.classList.contains("testClass3")).toBe(false);
});

it("should successfully click the zoom in and zoom out button", async () => {
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const user = userEvent.setup();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <Zoom mapId={mapId}></Zoom>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    // zoom is mounted
    const { zoomDiv } = await waitForZoom();

    const zoomInButton = zoomDiv.querySelector(".btn-zoom-in") as HTMLButtonElement;
    const zoomOutButton = zoomDiv.querySelector(".btn-zoom-out") as HTMLButtonElement;

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

async function waitForZoom() {
    const { zoomDiv } = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const zoomDiv = domElement.querySelector(".zoom");
        if (!zoomDiv) {
            throw new Error("zoom component not rendered");
        }

        return { zoomDiv };
    });
    return { zoomDiv };
}
