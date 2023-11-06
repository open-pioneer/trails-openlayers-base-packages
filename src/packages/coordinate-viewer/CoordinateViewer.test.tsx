// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import View from "ol/View";
import BaseEvent from "ol/events/Event";
import { expect, it } from "vitest";
import { CoordinateViewer, useCoordinatesString } from "./CoordinateViewer";

it("should successfully create a coordinate viewer component", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <CoordinateViewer mapId={mapId} data-testid="coordinate-viewer" />
        </PackageContextProvider>
    );

    // coordinate viewer is mounted
    const { viewerDiv } = await waitForCoordinateViewer();
    expect(viewerDiv).toMatchSnapshot();

    // check coordinate viewer box is available
    expect(viewerDiv.tagName).toBe("DIV");
});

it("should successfully create a coordinate viewer component with additional css classes", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <CoordinateViewer mapId={mapId} className="test" data-testid="coordinate-viewer" />
        </PackageContextProvider>
    );

    const { viewerDiv } = await waitForCoordinateViewer();
    expect(viewerDiv.classList.contains("test")).toBe(true);
    expect(viewerDiv.classList.contains("foo")).toBe(false);
});

it("tracks the user's mouse position", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateViewer mapId={mapId} precision={1} data-testid="coordinate-viewer" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { viewerText } = await waitForCoordinateViewer();
    expect(viewerText.textContent).toMatchInlineSnapshot('""');

    const map = await registry.expectMapModel(mapId);

    const simulateMove = (x: number, y: number) => {
        const fakeMoveEvent = new BaseEvent("pointermove");
        (fakeMoveEvent as any).coordinate = [x, y];
        map.olMap.dispatchEvent(fakeMoveEvent);
    };

    // Simple move
    act(() => {
        simulateMove(123.4, 567.8);
    });
    expect(viewerText.textContent).toMatchInlineSnapshot('"123.4 567.8 EPSG:3857"');

    // Another move + projection change
    act(() => {
        map.olMap.setView(
            new View({
                center: [0, 0],
                zoom: 0,
                projection: "EPSG:4326"
            })
        );
        simulateMove(42, 1337);
    });
    expect(viewerText.textContent).toMatchInlineSnapshot('"42.0 1,337.0 EPSG:4326"');
});

it("should format coordinates to correct coordinate string for the corresponding locale and precision", async () => {
    const coords = [3545.08081, 4543543.009];

    const renderCoords = (locale: string, precision = 2) => {
        return renderHook(() => useCoordinatesString(coords, precision), {
            wrapper: (props) => <PackageContextProvider {...props} locale={locale} />
        });
    };

    const hookEN = renderCoords("en");
    const stringCoordinates = hookEN.result.current;
    expect(stringCoordinates).equals("3,545.08 4,543,543.01");

    const hookDE = renderCoords("de", 3);
    expect(hookDE.result.current).equals("3.545,081 4.543.543,009");

    const hookDE_precision0 = renderCoords("de", 0);
    expect(hookDE_precision0.result.current).equals("3.545 4.543.543");
});

it("should format coordinates to correct coordinate string with default precision", async () => {
    const coords = [3545.08081, 4543543.009];
    const hookDeWithoutPrecision = renderHook(() => useCoordinatesString(coords, undefined), {
        wrapper: (props) => <PackageContextProvider {...props} locale="de" />
    });
    expect(hookDeWithoutPrecision.result.current).equals("3.545,0808 4.543.543,0090");
});

async function waitForCoordinateViewer() {
    const { viewerDiv, viewerText } = await waitFor(async () => {
        const viewerDiv = await screen.findByTestId("coordinate-viewer");

        const viewerText = viewerDiv.querySelector(".coordinate-viewer-text");
        if (!viewerText) {
            throw new Error("coordinate viewer text not rendered");
        }

        return { viewerDiv, viewerText };
    });

    return { viewerDiv, viewerText };
}
