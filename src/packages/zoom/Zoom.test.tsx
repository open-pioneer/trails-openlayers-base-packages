// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { MapContainer } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import {
    createPackageContextProviderProps,
    setupMap,
    waitForMapMount
} from "@open-pioneer/map/test-utils";
import ResizeObserver from "resize-observer-polyfill";
import userEvent from "@testing-library/user-event";
import { Zoom } from "./Zoom";

// used to avoid a "ResizeObserver is not defined" error
global.ResizeObserver = ResizeObserver;

it("should successfully create a zoom component with a zoom in and a zoom out button", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <Zoom mapId={mapId}></Zoom>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    //mount ZoomComponent
    const { zoomDiv } = await waitForZoomComponent();
    expect(zoomDiv).toMatchSnapshot();

    const zoomInButton = zoomDiv.querySelectorAll(".zoomin-button");
    expect(zoomInButton.length).toBe(1);
    expect(zoomInButton[0]).toBeInstanceOf(HTMLButtonElement);

    const zoomOutButton = zoomDiv.querySelectorAll(".zoomout-button");
    expect(zoomOutButton.length).toBe(1);
    expect(zoomOutButton[0]).toBeInstanceOf(HTMLButtonElement);
});

it("should successfully create a zoom component with additional css classes", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <Zoom mapId={mapId} className="testClass1 testClass2"></Zoom>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    //mount ZoomComponent
    const { zoomDiv } = await waitForZoomComponent();
    expect(zoomDiv).toMatchSnapshot();

    expect(zoomDiv.classList.contains("testClass1")).toBe(true);
    expect(zoomDiv.classList.contains("testClass2")).toBe(true);
});

it("should successfully click the zoom in and zoom out button", async () => {
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const user = userEvent.setup();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <Zoom mapId={mapId}></Zoom>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    //mount ZoomComponent
    const { zoomDiv } = await waitForZoomComponent();
    expect(zoomDiv).toMatchSnapshot();

    const zoomInButton = zoomDiv.querySelector(".zoomin-button") as HTMLButtonElement;
    const zoomOutButton = zoomDiv.querySelector(".zoomout-button") as HTMLButtonElement;

    let oldZoom: number | undefined = map.olMap.getView().getZoom();
    let zoom: number | undefined;

    await user.click(zoomInButton);
    await waitFor(() => {
        zoom = map.olMap.getView().getZoom();
        if (oldZoom === undefined || zoom === undefined) {
            throw new Error("zoom level is undefined");
        } else {
            expect(zoom).toBe(oldZoom + 1);
        }
    });

    oldZoom = zoom;

    await user.click(zoomOutButton);
    await waitFor(() => {
        zoom = map.olMap.getView().getZoom();
        if (oldZoom === undefined || zoom === undefined) {
            throw new Error("zoom level is undefined");
        } else {
            expect(zoom).toBe(oldZoom - 1);
        }
    });
});

async function waitForZoomComponent() {
    const { domElement, zoomDiv } = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const zoomDiv = domElement.querySelector(".zoom");
        if (!zoomDiv) {
            throw new Error("zoom component not rendered");
        }

        return { domElement, zoomDiv };
    });
    return { domElement, zoomDiv };
}
