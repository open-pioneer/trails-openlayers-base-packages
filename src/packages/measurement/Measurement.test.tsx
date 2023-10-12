// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { Measurement } from "./Measurement";
import { expect, it } from "vitest";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import Draw from "ol/interaction/Draw";
import { Interaction } from "ol/interaction";
import OlMap from "ol/Map";

it("should successfully create a measurement component", async () => {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <Measurement mapId={mapId} data-testid="measurement"></Measurement>
        </PackageContextProvider>
    );

    // measurement is mounted
    const { measurementDiv, measurementSelectDiv, measurementSelect } = await waitForMeasurement();
    expect(measurementDiv).toMatchSnapshot();

    // check measurement select is available
    expect(measurementSelectDiv).toBeInstanceOf(HTMLDivElement);
    expect(measurementSelect).toBeInstanceOf(HTMLSelectElement);
});

it("should successfully create a measurement component with additional css classes and box properties", async () => {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <Measurement mapId={mapId} className="test" data-testid="measurement"></Measurement>
        </PackageContextProvider>
    );

    // measurement is mounted
    const { measurementDiv } = await waitForMeasurement();
    expect(measurementDiv).toMatchSnapshot();

    expect(measurementDiv.classList.contains("test")).toBe(true);
    expect(measurementDiv.classList.contains("foo")).toBe(false);
});

it("should successfully select a measurement from the select dropdown", async () => {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <Measurement mapId={mapId} className="test" data-testid="measurement"></Measurement>
        </PackageContextProvider>
    );

    // measurement is mounted
    const { measurementSelect } = await waitForMeasurement();

    act(() => {
        fireEvent.change(measurementSelect, { target: { value: "area" } });
    });
    expect(measurementSelect.value).toBe("area");

    act(() => {
        fireEvent.change(measurementSelect, { target: { value: "distance" } });
    });
    expect(measurementSelect.value).toBe("distance");
});

it("should successfully add tooltip overlays to the map", async () => {
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <Measurement mapId={mapId} className="test" data-testid="measurement"></Measurement>
        </PackageContextProvider>
    );

    // measurement is mounted
    const { measurementSelect } = await waitForMeasurement();

    act(() => {
        fireEvent.change(measurementSelect, { target: { value: "distance" } });
    });

    const overlays = map.olMap.getOverlays().getArray();
    let measurementOverlayElement;
    overlays.forEach((ol) => {
        if (ol.getElement()?.classList.contains("measurement-tooltip")) {
            measurementOverlayElement = ol.getElement();
        }
    });

    expect(measurementOverlayElement).toBeInstanceOf(HTMLDivElement);
});

it("should successfully activate draw interaction for the right geometry type", async () => {
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <Measurement mapId={mapId} className="test" data-testid="measurement"></Measurement>
        </PackageContextProvider>
    );

    // measurement is mounted
    const { measurementSelect } = await waitForMeasurement();

    act(() => {
        fireEvent.change(measurementSelect, { target: { value: "area" } });
    });
    const areaGeometryType = getGeometryType(map.olMap);
    expect(areaGeometryType).toBe("Polygon");

    act(() => {
        fireEvent.change(measurementSelect, { target: { value: "distance" } });
    });
    const distanceGeometryType = getGeometryType(map.olMap);
    expect(distanceGeometryType).toBe("LineString");
});

async function waitForMeasurement() {
    const { measurementDiv, measurementSelectDiv, measurementSelect } = await waitFor(async () => {
        const measurementDiv: HTMLDivElement | null =
            await screen.findByTestId<HTMLDivElement>("measurement");
        if (!measurementDiv) {
            throw new Error("Measurement not rendered");
        }

        const measurementSelectDiv = measurementDiv.querySelector(".measurement-content");
        if (!measurementSelectDiv) {
            throw new Error("Measurement select container not rendered");
        }

        const measurementSelect =
            measurementSelectDiv.querySelector<HTMLSelectElement>(".measurement-select");

        if (!measurementSelect) {
            throw new Error("Measurement select not rendered");
        }

        return { measurementDiv, measurementSelectDiv, measurementSelect };
    });

    return { measurementDiv, measurementSelectDiv, measurementSelect };
}

function getGeometryType(olMap: OlMap) {
    const interactions = olMap.getInteractions().getArray();
    const draw = interactions?.find((interaction: Interaction) => interaction instanceof Draw) as
        | Draw
        | undefined;
    const geometryType: string | undefined = (draw as any)?.type_;
    return geometryType;
}
