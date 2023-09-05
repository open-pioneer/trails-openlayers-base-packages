// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { MapContainer } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { createPackageContextProviderProps, setupMap, waitForMapMount } from "./test-utils";
import ResizeObserver from "resize-observer-polyfill";
import userEvent from "@testing-library/user-event";
import { InitialExtent } from "./InitialExtent";

/* import { MapModelImpl } from "@open-pioneer/map/model/MapModelImpl"; */

// used to avoid a "ResizeObserver is not defined" error
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
    // mapModel.olMap.setSize([500, 500]); // simulate map mount

    // todo: why does whenDisplayed() not resolve?
    // If 'mapModel.olMap.setSize([500, 500]);' is called, the whenDisplayed does resolve, however another error is thrown
    //await mapModel.whenDisplayed(); // wait to make sure that "initialExtent" is initialized

    const initExtentBtn = initExtentDiv.querySelector(
        ".initial-extent-button"
    ) as HTMLButtonElement;

    //const berlin = { xMin: 1489200, yMin: 6894026, xMax: 1489200, yMax: 6894026 };

    //FIXME: https://github.com/open-pioneer/trails-openlayers-base-packages/issues/121
    //FIXME: initialExtent should be set through map api?

    console.log("initExt", mapModel.initialExtent); //undefined
    console.log("extent1", mapModel.olMap.getView().calculateExtent());

    mapModel.olMap.getView().fit([1479200, 6884026, 1499200, 6897026]);
    console.log("extent2", mapModel.olMap.getView().calculateExtent());

    await user.click(initExtentBtn); //clicked -> extent2 === extent3
    console.log("extent3", mapModel.olMap.getView().calculateExtent());
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
