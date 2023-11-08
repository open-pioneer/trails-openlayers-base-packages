// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Geolocation } from "./Geolocation";
import { NotificationService } from "@open-pioneer/notifier";

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
    expect(geolocationBtn).toBeInstanceOf(HTMLButtonElement); // todo tagname -> https://github.com/open-pioneer/trails-oenlayers-base-packages/pull/194/files
    expect(geolocationBtn).toMatchSnapshot();
});
