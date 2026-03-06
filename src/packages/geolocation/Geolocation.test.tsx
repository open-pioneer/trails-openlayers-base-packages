// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { MapContainer } from "@open-pioneer/map";
import { setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { Geolocation } from "./Geolocation";
import { NotificationService, NotificationOptions } from "@open-pioneer/notifier";
import { mockSuccessGeolocation, mockErrorGeolocation } from "./test-utils";
import VectorLayer from "ol/layer/Vector";
import userEvent from "@testing-library/user-event";

beforeAll(() => {
    mockVectorLayer();
});

beforeEach(() => {
    vi.restoreAllMocks();
});

it("should successfully create a geolocation component with a button", async () => {
    const { map, layerFactory } = await setupMap();
    const notifier: Partial<NotificationService> = {
        notify() {
            throw new Error("not implemented");
        }
    };

    const injectedServices = {
        "notifier.NotificationService": notifier,
        "map.LayerFactory": layerFactory
    };

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="map" />
            <Geolocation map={map} data-testid="geolocation" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    // Mount geolocation component
    const button = await getGeolocationButton();
    expect(button.tagName).toBe("BUTTON");

    expect(button).toMatchSnapshot();
});

it("should center to user's position", async () => {
    mockSuccessGeolocation([51.1, 45.3]);

    const user = userEvent.setup();

    const { map, layerFactory } = await setupMap({
        center: { x: 0, y: 0 },
        projection: "EPSG:4326"
    });
    const olMap = map.olMap;

    const notifier: Partial<NotificationService> = {
        notify() {
            throw new Error("not implemented");
        }
    };
    const injectedServices = {
        "notifier.NotificationService": notifier,
        "map.LayerFactory": layerFactory
    };

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="map" />
            <Geolocation map={map} data-testid="geolocation" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    const firstCenter = olMap.getView().getCenter();
    expect(firstCenter).toBeDefined();

    // Mount geolocation component
    const button = await getGeolocationButton();
    expect(button.tagName).toBe("BUTTON");
    await user.click(button);

    await waitFor(() => {
        const nextCenter = olMap.getView().getCenter();
        expect(nextCenter).not.toEqual(firstCenter);
        expect(nextCenter).toBeDefined();
    });
});

it("should zoom to user's position accuracy", async () => {
    mockSuccessGeolocation([51.1, 45.3]);

    const user = userEvent.setup();

    const { map, layerFactory } = await setupMap({
        center: { x: 0, y: 0 },
        projection: "EPSG:4326"
    });
    const olMap = map.olMap;

    const notifier: Partial<NotificationService> = {
        notify() {
            throw new Error("not implemented");
        }
    };
    const injectedServices = {
        "notifier.NotificationService": notifier,
        "map.LayerFactory": layerFactory
    };

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="map" />
            <Geolocation map={map} data-testid="geolocation" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    const firstZoomLevel = olMap.getView().getZoom();
    expect(firstZoomLevel).toBeDefined();

    // Mount geolocation component
    const button = await getGeolocationButton();
    expect(button.tagName).toBe("BUTTON");
    await user.click(button);

    await waitFor(() => {
        const nextZoomLevel = olMap.getView().getZoom();
        expect(nextZoomLevel).not.toEqual(firstZoomLevel);
        expect(nextZoomLevel).toBeDefined();
    });
});

it("should successfully create an error with notifier message", async () => {
    mockErrorGeolocation();

    // Silence console.error
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const user = userEvent.setup();

    const { map, layerFactory } = await setupMap({
        center: { x: 0, y: 0 },
        projection: "EPSG:4326"
    });

    const notifyArr: NotificationOptions[] = [];
    const notifier: Partial<NotificationService> = {
        notify(options: NotificationOptions) {
            notifyArr.push(options);
        }
    };

    const injectedServices = {
        "notifier.NotificationService": notifier,
        "map.LayerFactory": layerFactory
    };

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="map" />
            <Geolocation map={map} data-testid="geolocation" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    // Mount geolocation component
    const button = await getGeolocationButton();
    expect(button.tagName).toBe("BUTTON");
    await user.click(button);

    // Mocked geolocation returns an error; the UI should emit a notification
    await waitFor(() => {
        if (notifyArr.length === 0) {
            throw new Error("Expected a notification");
        }
    });

    expect(notifyArr).toMatchInlineSnapshot(`
      [
        {
          "level": "error",
          "message": "positionUnavailable",
          "title": "error",
        },
      ]
    `);
});

async function getGeolocationButton() {
    return await screen.findByTestId("geolocation");
}

function mockVectorLayer() {
    // Overwrite render so it doesn't actually do anything during tests.
    // Would otherwise error because <canvas /> is not fully implemented in happy dom.
    const div = document.createElement("div");
    VectorLayer.prototype.render = () => {
        return div;
    };
}
