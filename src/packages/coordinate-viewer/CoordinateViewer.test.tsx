// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import View from "ol/View";
import BaseEvent from "ol/events/Event";
import { expect, it } from "vitest";
import { CoordinateViewer, CoordinateViewerProps } from "./CoordinateViewer";

it("should successfully create a coordinate viewer component", async () => {
    const { viewerDiv } = await setup();
    expect(viewerDiv).toMatchSnapshot();

    // check coordinate viewer box is available
    expect(viewerDiv.tagName).toBe("DIV");
});

it("should successfully create a coordinate viewer component with additional css classes", async () => {
    const { viewerDiv } = await setup({
        props: {
            className: "test"
        }
    });

    expect(viewerDiv.classList.contains("test")).toBe(true);
    expect(viewerDiv.classList.contains("foo")).toBe(false);
});

it("tracks the user's mouse position", async () => {
    const { viewerText, simulatePointerMove, changeProjection } = await setup({
        renderMap: true,
        props: {
            precision: 1
        }
    });
    expect(viewerText.textContent).toMatchInlineSnapshot('""');

    // Simple move
    act(() => {
        simulatePointerMove(123.4, 567.8);
    });
    expect(viewerText.textContent).toMatchInlineSnapshot('"123.4 567.8 EPSG:3857"');

    // Another move + projection change
    act(() => {
        changeProjection("EPSG:4326");
        simulatePointerMove(42, 1337);
    });
    expect(viewerText.textContent).toMatchInlineSnapshot('"42.0 1,337.0 EPSG:4326"');
});

it("should display transformed coordinates if output projection is provided", async () => {
    const outputProjection = "EPSG:4326"; //WGS84
    const { viewerText, simulatePointerMove } = await setup({
        props: {
            precision: 2,
            displayProjectionCode: outputProjection
        }
    });
    expect(viewerText.textContent).toMatchInlineSnapshot('""');

    act(() => {
        simulatePointerMove(851594.11, 6789283.95); //map projection is EPSG:3857 (Web Mercator)
    });
    //851594.11, 6789283.95 (EPSG:3857) == 7.65, 51.94 (EPSG:4326)
    expect(viewerText.textContent).toMatchInlineSnapshot('"7.65 51.94 EPSG:4326"'); //should display WGS84
});

it("tracks the user's mouse position, when format is set to 'degree'", async () => {
    const { viewerText, simulatePointerMove, changeProjection } = await setup({
        renderMap: true,
        props: {
            format: "degree",
            precision: 2
        }
    });
    expect(viewerText.textContent).toMatchInlineSnapshot('""');

    // Simple move
    act(() => {
        simulatePointerMove(7.65, 51.94);
    });
    expect(viewerText.textContent).toMatchInlineSnapshot(
        '"7°39\'0.00"(E) 51°56\'24.00"(N) EPSG:3857"'
    );

    // Another move + projection change
    act(() => {
        changeProjection("EPSG:4326");
        simulatePointerMove(42, 1337);
    });
    expect(viewerText.textContent).toMatchInlineSnapshot(
        '"42°0\'0.00"(E) 1337°0\'0.00"(N) EPSG:4326"'
    );
});

it("should display transformed coordinates if output projection is provided and format is set to 'degree'", async () => {
    const outputProjection = "EPSG:4326"; //WGS84
    const { viewerText, simulatePointerMove } = await setup({
        renderMap: true,
        props: {
            format: "degree",
            precision: 2,
            displayProjectionCode: outputProjection
        }
    });
    expect(viewerText.textContent).toMatchInlineSnapshot('""');

    act(() => {
        simulatePointerMove(851594.11, 6789283.95); //map projection is EPSG:3857 (Web Mercator)
    });
    //851594.11, 6789283.95 (EPSG:3857) == 7°39'0.00"(E) 51°56'24.00"(N) (EPSG:4326)
    expect(viewerText.textContent).toMatchInlineSnapshot(
        '"7°39\'0.00"(E) 51°56\'24.00"(N) EPSG:4326"'
    ); //should display WGS84 in Degree
});

async function setup(options?: { renderMap?: boolean; props?: CoordinateViewerProps }) {
    const { map } = await setupMap();

    const renderMap = options?.renderMap ?? false;
    const props = options?.props;
    render(
        <PackageContextProvider>
            {renderMap && <MapContainer map={map} data-testid="map" />}
            <CoordinateViewer {...props} map={map} data-testid="coordinate-viewer" />
        </PackageContextProvider>
    );

    if (renderMap) {
        await waitForMapMount("map");
    }

    const { viewerDiv, viewerText } = await waitForCoordinateViewer();

    const simulatePointerMove = (x: number, y: number) => {
        const fakeMoveEvent = new BaseEvent("pointermove");
        (fakeMoveEvent as any).coordinate = [x, y];
        map.olMap.dispatchEvent(fakeMoveEvent);
    };

    const changeProjection = (projectionCode: string) => {
        map.olMap.setView(
            new View({
                center: [0, 0],
                zoom: 0,
                projection: projectionCode
            })
        );
    };

    return { map, viewerDiv, viewerText, simulatePointerMove, changeProjection };
}

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
