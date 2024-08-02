// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { get, getPointResolution } from "ol/proj";
import { ScaleSetter } from "./ScaleSetter";
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

it("should successfully create a scale Setter component", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <ScaleSetter mapId={mapId} data-testid="scale-setter" />
        </PackageContextProvider>
    );

    // scale Setter is mounted
    const { setterDiv, setterButton } = await waitForScaleSetter();
    expect(setterDiv).toMatchSnapshot();

    // check scale setter box is available
    expect(setterButton.tagName).toBe("BUTTON");
});

it("should successfully create a scale setter component with additional css classes and box properties", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <ScaleSetter mapId={mapId} className="test test1 test2" data-testid="scale-setter" />
        </PackageContextProvider>
    );

    // scale setter is mounted
    const { setterDiv } = await waitForScaleSetter();
    expect(setterDiv).toMatchSnapshot();

    // check scale setter box is available
    if (!setterDiv) {
        throw new Error("scale text not rendered");
    }

    expect(setterDiv.tagName).toBe("DIV");
    expect(setterDiv.classList.contains("test")).toBe(true);
    expect(setterDiv.classList.contains("test1")).toBe(true);
    expect(setterDiv.classList.contains("test2")).toBe(true);
    expect(setterDiv.classList.contains("test3")).not.toBe(true);
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
            <ScaleSetter mapId={mapId} data-testid="scale-setter" />
        </PackageContextProvider>
    );

    const { setterButton } = await waitForScaleSetter();
    expect(setterButton.textContent).toBe("1 : 21,026");

    result.rerender(
        <PackageContextProvider services={injectedServices} locale="de">
            <ScaleSetter mapId={mapId} data-testid="scale-setter" />
        </PackageContextProvider>
    );
    expect(setterButton.textContent).toBe("1 : 21.026");
});

it("should successfully update the map scale and label when selection changes", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });
    const map = await registry.expectMapModel(mapId);
    const olMap = map.olMap;
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <ScaleSetter mapId={mapId} data-testid="scale-setter" />
        </PackageContextProvider>
    );
    const { setterButton, setterMenu } = await waitForScaleSetter();
    await showMenuoptions(setterButton);
    const setterOptions = await getMenuOptions(setterMenu);
    if (setterOptions[0] == undefined) return;
    await userEvent.click(setterOptions[0]!);
    const DEFAULT_DPI = 25.4 / 0.28;
    const INCHES_PER_METRE = 39.37;
    const resolution = olMap.getView().getResolution();
    const center = olMap.getView().getCenter();
    if (resolution == undefined || center == undefined) {
        throw new Error("Map view not rendered");
    }
    const pointResolution = getPointResolution(olMap.getView().getProjection(), resolution, center);
    const scale = Math.round(pointResolution * INCHES_PER_METRE * DEFAULT_DPI);
    expect(scale.toString()).toBe(setterOptions[0]!.value);
    expect(setterButton.textContent).toBe("1 : " + scale.toLocaleString());
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
            <ScaleSetter mapId={mapId} data-testid="scale-setter" />
        </PackageContextProvider>
    );
    const { setterButton } = await waitForScaleSetter();
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
    if (resolution == undefined || center == undefined) {
        throw new Error("Map view not rendered");
    }
    const pointResolution = getPointResolution(olMap.getView().getProjection(), resolution, center);
    const scale = Math.round(pointResolution * INCHES_PER_METRE * DEFAULT_DPI);
    expect(setterButton.textContent).toBe("1 : " + scale.toLocaleString());
});

it("should use default scales when nothing is set", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <ScaleSetter mapId={mapId} data-testid="scale-setter" />
        </PackageContextProvider>
    );

    const { setterButton, setterMenu } = await waitForScaleSetter();
    await showMenuoptions(setterButton);
    const setterOptions = await getMenuOptions(setterMenu);
    const setterOptionValues = await getOptionValues(setterOptions);

    const advScale = [
        17471320, 8735660, 4367830, 2183915, 1091957, 545978, 272989, 136494, 68247, 34123, 17061,
        8530, 4265, 2132
    ];

    expect(setterOptionValues).toStrictEqual(advScale);
});

it("should use given scales when something is set", async () => {
    const scales = [10000, 9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000, 500, 10];
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <ScaleSetter mapId={mapId} scales={scales} data-testid="scale-setter" />
        </PackageContextProvider>
    );

    const { setterButton, setterMenu } = await waitForScaleSetter();
    await showMenuoptions(setterButton);
    const setterOptions = await getMenuOptions(setterMenu);
    const setterOptionValues = await getOptionValues(setterOptions);

    expect(setterOptionValues).toStrictEqual(scales);
});

async function waitForScaleSetter() {
    const { setterDiv, setterButton, setterMenu } = await waitFor(async () => {
        const setterDiv = await screen.findByTestId("scale-setter");
        const setterButton = setterDiv.querySelector("button"); // find first HTMLParagraphElement (scale select) in scale setter component
        if (!setterButton) {
            throw new Error("scale select Button not rendered");
        }
        const setterMenu = setterDiv.querySelector("div"); // find first HTMLParagraphElement (scale menu) in scale setter component
        if (!setterMenu) {
            throw new Error("scale menu not rendered");
        }

        return { setterDiv, setterButton, setterMenu };
    });

    return { setterDiv, setterButton, setterMenu };
}

function showMenuoptions(setterButton: HTMLElement) {
    // open dropdown to include options in snapshot; react-select creates list of options in dom after opening selection
    act(() => {
        fireEvent.keyDown(setterButton, { key: "ArrowDown" });
    });
}

function getMenuOptions(setterMenu: Element) {
    return Array.from(
        setterMenu.getElementsByClassName("scale-setter-option")
    ) as HTMLButtonElement[];
}

function getOptionValues(setterOptions: HTMLButtonElement[]) {
    const optionValues: number[] = [];
    setterOptions.forEach((option) => {
        optionValues.push(parseInt(option.value));
    });
    return optionValues;
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}
