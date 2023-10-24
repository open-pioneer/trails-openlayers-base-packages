// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { Geolocation } from "./Geolocation";
import { createService } from "@open-pioneer/test-utils/services";
import { NotificationServiceImpl } from "@open-pioneer/notifier/NotificationServiceImpl";

it("should successfully create a geolocation component with a button", async () => {
    const { mapId, registry } = await setupMap();

    const notifier = await createService(NotificationServiceImpl);

    // TODO: klaeren, ob es sinnvoll ist, die Methode erweiterbar zu machen
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
    expect(geolocationBtn).toBeInstanceOf(HTMLButtonElement);
    expect(geolocationBtn).toMatchSnapshot();
});
