// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { Geolocation } from "./Geolocation";
import { NotificationService, NotificationOptions } from "@open-pioneer/notifier";
import { setup, mockSuccessGeolocation, mockErrorGeolocation } from "./test-utils";
import { GeolocationController } from "./GeolocationController";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import userEvent from "@testing-library/user-event";

beforeAll(() => {
    mockVectorLayer();
});

beforeEach(() => {
    vi.restoreAllMocks();
});

it("should successfully create a geolocation component with a button", async () => {
    const { mapId, registry } = await setupMap();

    const notifier: Partial<NotificationService> = {
        notify() {
            throw new Error("not implemented");
        }
    };

    const injectedServices = createServiceOptions({
        registry
    });
    injectedServices["notifier.NotificationService"] = notifier;

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <Geolocation mapId={mapId} data-testid="geolocation" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    // Mount geolocation component
    const button = await getGeolocationButton();
    expect(button.tagName).toBe("BUTTON");

    expect(button).toMatchSnapshot();
});

it.only("should center to user's position", async () => {
    mockSuccessGeolocation([51.1, 45.3]);

    const user = userEvent.setup();

    const { mapId, registry } = await setupMap({
        center: { x: 0, y: 0 },
        projection: "EPSG:4326"
    });

    const map = (await registry.expectMapModel(mapId))?.olMap;

    const notifier: Partial<NotificationService> = {
        notify() {
            throw new Error("not implemented");
        }
    };

    const injectedServices = createServiceOptions({
        registry
    });
    injectedServices["notifier.NotificationService"] = notifier;

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <Geolocation mapId={mapId} data-testid="geolocation" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    const firstCenter = map.getView().getCenter();

    // Mount geolocation component
    const button = await getGeolocationButton();
    expect(button.tagName).toBe("BUTTON");
    await user.click(button);

    const nextCenter = map.getView().getCenter();

    await waitFor(() => {
        if (firstCenter?.[0] === nextCenter?.[0] && firstCenter?.[1] === nextCenter?.[1]) {
            throw new Error("Map center not changed");
        }
    });

    expect(nextCenter).not.toEqual(firstCenter);
});

it.skip("should not change map center while changing user's position", async () => {
    const { mapId, registry } = await setupMap({
        center: { x: 0, y: 0 },
        projection: "EPSG:4326"
    });

    const map = (await registry.expectMapModel(mapId))?.olMap;

    const notifier: Partial<NotificationService> = {
        notify() {
            throw new Error("not implemented");
        }
    };

    const injectedServices = createServiceOptions({
        registry
    });
    injectedServices["notifier.NotificationService"] = notifier;

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <Geolocation mapId={mapId} data-testid="geolocation" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    const firstCenter = map.getView().getCenter();

    // Simulate first geolocation
    mockSuccessGeolocation([51.1, 45.3]);
    const controller: GeolocationController = setup();
    await controller.startGeolocation(map);

    const nextCenter = map.getView().getCenter();

    // Check, if map is centered to user position
    expect(nextCenter).not.toEqual(firstCenter);
    const nextPositionFeature: Feature<Geometry> | undefined = controller.getPositionFeature();
    expect(nextPositionFeature?.getGeometry()?.getExtent()).toStrictEqual([45.3, 51.1, 45.3, 51.1]);

    // Simulate second geolocation
    // mockSuccessGeolocation([51.1, 6.3]);
    /** Trigger position change event on Geolocation */

    const lastCenter = map.getView().getCenter();

    // Check, if map isn't centered to user position
    expect(lastCenter).toStrictEqual(nextCenter);
    const lastPositionFeature: Feature<Geometry> | undefined = controller.getPositionFeature();
    expect(lastPositionFeature?.getGeometry()?.getExtent()).toStrictEqual([6.3, 51.1, 6.3, 51.1]);
});

it.skip("should not change user position while changing zoom level", async () => {});

it("should successfully create an error with notifier message", async () => {
    mockErrorGeolocation();

    // Silence console.error
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const user = userEvent.setup();

    const { mapId, registry } = await setupMap({
        center: { x: 0, y: 0 },
        projection: "EPSG:4326"
    });

    const notifyArr: NotificationOptions[] = [];

    const notifier: Partial<NotificationService> = {
        notify(options: NotificationOptions) {
            notifyArr.push(options);
        }
    };

    const injectedServices = createServiceOptions({
        registry
    });
    injectedServices["notifier.NotificationService"] = notifier;

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <Geolocation mapId={mapId} data-testid="geolocation" />
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
