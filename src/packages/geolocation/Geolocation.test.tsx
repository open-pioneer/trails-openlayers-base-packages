// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Geolocation } from "./Geolocation";
import { NotificationService, NotificationOptions } from "@open-pioneer/notifier";
import { setup, mockSuccessGeolocation } from "./utils";
import { GeolocationController } from "./GeolocationController";
import { Feature } from "ol";
import { Geometry } from "ol/geom";

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

    //mount GeolocationComponent
    const geolocationBtn = await screen.findByTestId("geolocation");
    expect(geolocationBtn.tagName).toBe("BUTTON");
    expect(geolocationBtn).toMatchSnapshot();
});

it("should center to user's position", async () => {
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

    mockSuccessGeolocation([51.1, 45.3]);

    const controller: GeolocationController = setup();
    await controller.startGeolocation(map);

    const nextCenter = map.getView().getCenter();

    expect(nextCenter).not.toEqual(firstCenter);
});

it.skip("should do not change map center while changing user's position", async () => {
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

    mockSuccessGeolocation([51.1, 45.3]);

    const controller: GeolocationController = setup();
    await controller.startGeolocation(map);

    const positionFeature: Feature<Geometry> | undefined = controller.getPositionFeature();
    expect(positionFeature?.getGeometry()?.getExtent()).toStrictEqual([45.3, 51.1, 45.3, 51.1]);

    const nextCenter = map.getView().getCenter();

    expect(nextCenter).not.toEqual(firstCenter);

    mockSuccessGeolocation([51.1, 6.3]);
    // await controller.startGeolocation(map);

    const nextPositionFeature: Feature<Geometry> | undefined = controller.getPositionFeature();
    expect(nextPositionFeature?.getGeometry()?.getExtent()).toStrictEqual([45.3, 51.1, 45.3, 51.1]);

    // // const firstExtent = getCurrentExtent(mapModel.olMap);
    // const extent = [1479200, 6884026, 1499200, 6897026];

    // // Karte verschieben
    // mapModel.olMap.getView().fit(extent);

    // mockSuccessGeolocation([51.1, 6.3]);

    // const nextPositionFeature: Feature<Geometry> | undefined = controller.getPositionFeature();
    // expect(nextPositionFeature?.getGeometry()?.getExtent()).toStrictEqual([
    //     5042772.932935293, 6639001.66376131, 5042772.932935293, 6639001.66376131
    // ]);

    // // const nextExtent = getCurrentExtent(mapModel.olMap);

    // // // Test, ob sich die Position geändert hat
});

it.skip("should do not change user position while change zoom level", async () => {});

// siehe utils.ts "error todo"
it.skip("should successfully create a error with notifier message", async () => {
    const { mapId, registry } = await setupMap();

    const notifyArr = [];

    const notifier: Partial<NotificationService> = {
        notify(options: NotificationOptions) {
            notifyArr.push(options);
        }
    };

    /**
     * Todo: Geolocation mocken und Fehler erzeugen
     * -> Notify erzeugen
     * -> Überprüfen, ob Notifier einen Eintrag enthält
     */

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

    //mount GeolocationComponent
    const geolocationBtn = await screen.findByTestId("geolocation");
    expect(geolocationBtn.tagName).toBe("BUTTON");
    expect(geolocationBtn).toMatchSnapshot();
});
