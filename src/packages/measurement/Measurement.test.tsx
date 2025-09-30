// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import OlMap from "ol/Map";
import { Interaction } from "ol/interaction";
import Draw from "ol/interaction/Draw";
import { expect, it } from "vitest";
import { Measurement } from "./Measurement";

it("should successfully create a measurement component", async () => {
    const { map } = await setupMap();
    render(
        <PackageContextProvider>
            <Measurement map={map} data-testid="measurement"></Measurement>
        </PackageContextProvider>
    );

    // measurement is mounted
    const { measurementDiv, measurementSelect } = await waitForMeasurement();
    expect(measurementDiv).toMatchSnapshot();

    // check measurement select is available
    expect(measurementSelect.tagName).toBe("SELECT");
});

it("should successfully create a measurement component with additional css class", async () => {
    const { map } = await setupMap();
    render(
        <PackageContextProvider>
            <Measurement map={map} className="test" data-testid="measurement"></Measurement>
        </PackageContextProvider>
    );

    // measurement is mounted
    const { measurementDiv } = await waitForMeasurement();
    expect(measurementDiv.classList.contains("test")).toBe(true);
    expect(measurementDiv.classList.contains("foo")).toBe(false);
});

it("should successfully select a measurement from the select dropdown", async () => {
    const { map } = await setupMap();
    render(
        <PackageContextProvider>
            <Measurement map={map} className="test" data-testid="measurement"></Measurement>
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
    const { map } = await setupMap();
    render(
        <PackageContextProvider>
            <Measurement map={map} className="test" data-testid="measurement"></Measurement>
        </PackageContextProvider>
    );

    // measurement is mounted
    const { measurementSelect } = await waitForMeasurement();

    act(() => {
        fireEvent.change(measurementSelect, { target: { value: "distance" } });
    });

    const overlays = map.olMap.getOverlays().getArray();
    let measurementOverlayElement: HTMLElement | undefined;
    overlays.forEach((ol) => {
        if (ol.getElement()?.classList.contains("measurement-tooltip")) {
            measurementOverlayElement = ol.getElement();
        }
    });

    expect(measurementOverlayElement?.tagName).toBe("DIV");
});

it("should successfully activate draw interaction for the right geometry type", async () => {
    const { map } = await setupMap();
    render(
        <PackageContextProvider>
            <Measurement map={map} className="test" data-testid="measurement"></Measurement>
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
    const { measurementDiv, measurementSelect } = await waitFor(async () => {
        const measurementDiv: HTMLDivElement | null =
            await screen.findByTestId<HTMLDivElement>("measurement");
        if (!measurementDiv) {
            throw new Error("Measurement not rendered");
        }

        const measurementSelect =
            measurementDiv.querySelector<HTMLSelectElement>(".measurement-select");

        if (!measurementSelect) {
            throw new Error("Measurement select not rendered");
        }

        return { measurementDiv, measurementSelect };
    });

    return { measurementDiv, measurementSelect };
}

function getGeometryType(olMap: OlMap) {
    const interactions = olMap.getInteractions().getArray();
    const draw = interactions?.find((interaction: Interaction) => interaction instanceof Draw) as
        | Draw
        | undefined;
    const geometryType: string | undefined = (draw as any)?.type_;
    return geometryType;
}
