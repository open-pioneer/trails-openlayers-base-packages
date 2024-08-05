// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { get, getPointResolution } from "ol/proj";
import { ScaleInput } from "./ScaleInput";
import View from "ol/View";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import userEvent from "@testing-library/user-event";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";

const defaultBasemapConfig = [
    {
        id: "osm",
        title: "OSM",
        isBaseLayer: true,
        visible: true,
        olLayer: new TileLayer({
            source: new OSM(),
            minZoom: 10
        })
    }
];

it("should successfully create a scale Input component", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <ScaleInput mapId={mapId} data-testid="scale-input" />
        </PackageContextProvider>
    );

    // scale Input is mounted
    const { inputDiv, inputSelect } = await waitForScaleInput();
    expect(inputDiv).toMatchSnapshot();

    // check scale input box is available
    expect(inputSelect.tagName).toBe("INPUT");
});

it("should successfully create a scale input component with additional css classes and box properties", async () => {
    const { mapId, registry } = await setupMap();
    const center = [847541, 6793584];
    const resolution = 152.87399750768455;
    const projection = get("EPSG:3857");
    if (!projection) {
        throw new Error("projection not found");
    }
    const map = await registry.expectMapModel(mapId);
    const olMap = map.olMap;
    olMap.setView(
        new View({
            center,
            resolution,
            projection
        })
    );

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <ScaleInput mapId={mapId} className="test test1 test2" data-testid="scale-input" />
        </PackageContextProvider>
    );

    // scale input is mounted
    const { inputDiv } = await waitForScaleInput();
    expect(inputDiv).toMatchSnapshot();

    // check scale input box is available
    if (!inputDiv) {
        throw new Error("scale text not rendered");
    }

    expect(inputDiv.tagName).toBe("DIV");
    expect(inputDiv.classList.contains("test")).toBe(true);
    expect(inputDiv.classList.contains("test1")).toBe(true);
    expect(inputDiv.classList.contains("test2")).toBe(true);
    expect(inputDiv.classList.contains("test3")).not.toBe(true);
});

it("should successfully render the scale in the correct locale", async () => {
    const center = [847541, 6793584];
    const resolution = 9.554628535647032;
    const projection = get("EPSG:3857");
    if (!projection) {
        throw new Error("projection not found");
    }

    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const olMap = map.olMap;
    olMap.setView(
        new View({
            center,
            resolution,
            projection
        })
    );

    const injectedServices = createServiceOptions({ registry });
    const result = render(
        <PackageContextProvider services={injectedServices} locale="en">
            <ScaleInput mapId={mapId} data-testid="scale-input" />
        </PackageContextProvider>
    );

    const { inputSelect } = await waitForScaleInput();
    expect(inputSelect.value).toBe("21,026");

    result.rerender(
        <PackageContextProvider services={injectedServices} locale="de">
            <ScaleInput mapId={mapId} data-testid="scale-input" />
        </PackageContextProvider>
    );
    expect(inputSelect.value).toBe("21.026");
});

it("should successfully write user input in field", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <ScaleInput mapId={mapId} data-testid="scale-input" />
        </PackageContextProvider>
    );

    const { inputSelect } = await waitForScaleInput();

    await user.clear(inputSelect);
    await user.type(inputSelect, "20000");
    expect(inputSelect).toHaveValue("20.000");
});

it("should successfully change map scale and label on input", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <ScaleInput mapId={mapId} data-testid="scale-input" />
        </PackageContextProvider>
    );
    const { inputSelect } = await waitForScaleInput();
    const map = await registry.expectMapModel(mapId);
    const olMap = map.olMap;
    await act(async () => {
        await user.clear(inputSelect);
        await user.type(inputSelect, "8000");
        inputSelect.focus();
        await user.keyboard("{Enter}");
    });
    sleep(100);
    const DEFAULT_DPI = 25.4 / 0.28;
    const INCHES_PER_METRE = 39.37;
    const resolution = olMap.getView().getResolution();
    const center = olMap.getView().getCenter();
    if (resolution !== undefined && center !== undefined) {
        const pointResolution = getPointResolution(
            olMap.getView().getProjection(),
            resolution,
            center
        );
        const scale = Math.round(pointResolution * INCHES_PER_METRE * DEFAULT_DPI);
        expect(scale).toBe(8000);
        expect(inputSelect.value).toBe(scale.toLocaleString("de"));
    }
});

it("should successfully update the label when map scale changes after creation", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });
    const map = await registry.expectMapModel(mapId);
    const olMap = map.olMap;
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <ScaleInput mapId={mapId} data-testid="scale-input" />
        </PackageContextProvider>
    );
    const { inputSelect } = await waitForScaleInput();
    if (olMap.getView() == undefined || olMap.getView().getZoom() == undefined) {
        throw new Error("Map view not rendered");
    }
    act(() => {
        olMap.getView().setZoom(olMap.getView().getZoom()! - 1);
    });
    const DEFAULT_DPI = 25.4 / 0.28;
    const INCHES_PER_METRE = 39.37;
    const resolution = olMap.getView().getResolution();
    const center = olMap.getView().getCenter();

    expect(resolution).toBeDefined();
    expect(center).toBeDefined();
    const pointResolution = getPointResolution(
        olMap.getView().getProjection(),
        resolution!,
        center!
    );
    const scale = Math.round(pointResolution * INCHES_PER_METRE * DEFAULT_DPI);
    expect(inputSelect.value).toBe(scale.toLocaleString("de"));
});

async function waitForScaleInput() {
    const { inputDiv, inputSelect } = await waitFor(async () => {
        const inputDiv = await screen.findByTestId("scale-input");
        const inputSelect = inputDiv.querySelector("input"); // find first HTMLParagraphElement (scale select) in scale input component
        if (!inputSelect) {
            throw new Error("scale input not rendered");
        }

        return { inputDiv, inputSelect };
    });

    return { inputDiv, inputSelect };
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}
