// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Geolocation } from "./Geolocation";
import { NotificationService, NotificationOptions } from "@open-pioneer/notifier";

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

it.skip("should successfully create a notifier message", async () => {
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
