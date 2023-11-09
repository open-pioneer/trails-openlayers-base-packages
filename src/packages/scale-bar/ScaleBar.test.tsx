// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { ScaleBar } from "./ScaleBar";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { ScaleLine } from "ol/control";

it("should successfully create a scale bar component", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <ScaleBar mapId={mapId} data-testid="scale-bar" />
        </PackageContextProvider>
    );

    // scale bar is mounted
    const { scaleBarBox } = await waitForScaleBar();
    expect(scaleBarBox).toMatchSnapshot();

    // check scale bar box is available
    expect(scaleBarBox).toBeInstanceOf(HTMLDivElement);
});

it("should successfully create a scale bar component with additional css classes and box properties", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <ScaleBar mapId={mapId} className="test test1 test2" data-testid="scale-bar" />
        </PackageContextProvider>
    );

    // scale bar is mounted
    const { scaleBarBox } = await waitForScaleBar();
    expect(scaleBarBox).toMatchSnapshot();

    // check scale bar box is available
    expect(scaleBarBox).toBeInstanceOf(HTMLDivElement);
    expect(scaleBarBox.classList.contains("test")).toBe(true);
    expect(scaleBarBox.classList.contains("test1")).toBe(true);
    expect(scaleBarBox.classList.contains("test2")).toBe(true);
    expect(scaleBarBox.classList.contains("test3")).not.toBe(true);
});

it("should by default render a scale line, if property bar is missing", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <ScaleBar mapId={mapId} data-testid="scale-bar" />
        </PackageContextProvider>
    );

    // scale bar is mounted
    const { scaleBarBox, scaleBarDiv } = await waitForScaleBar();
    expect(scaleBarBox).toMatchSnapshot();

    // check scale bar box is available
    expect(scaleBarBox).toBeInstanceOf(HTMLDivElement);
    expect(scaleBarDiv.classList.contains("ol-scale-line")).toBe(true);
    expect(scaleBarDiv.classList.contains("ol-scale-bar")).not.toBe(true);
});

it("should render a scale bar, if property bar is set", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <ScaleBar mapId={mapId} bar={true} data-testid="scale-bar" />
        </PackageContextProvider>
    );

    // scale bar is mounted
    const { scaleBarBox, scaleBarDiv } = await waitForScaleBar();
    expect(scaleBarBox).toMatchSnapshot();

    // check scale bar box is available
    expect(scaleBarBox).toBeInstanceOf(HTMLDivElement);
    expect(scaleBarDiv.classList.contains("ol-scale-line")).not.toBe(true);
    expect(scaleBarDiv.classList.contains("ol-scale-bar")).toBe(true);
});

it("should successfully add ScaleLine to OpenLayers map controls", async () => {
    const { mapId, registry } = await setupMap();

    const olMap = (await registry.expectMapModel(mapId))?.olMap;

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <ScaleBar mapId={mapId} data-testid="scale-bar" />
        </PackageContextProvider>
    );

    // scale bar is mounted
    await waitForScaleBar();

    const controls = olMap?.getControls().getArray();
    const control = olMap?.getControls().getArray().at(1);
    expect(controls).toHaveLength(2);
    expect(control).toBeInstanceOf(ScaleLine);

    const scaleLine: ScaleLine = control as ScaleLine;
    const unit = scaleLine?.getUnits();
    expect(unit).equals("metric");
});

async function waitForScaleBar() {
    const { scaleBarBox, scaleBarDiv } = await waitFor(async () => {
        const scaleBarBox = await screen.findByTestId("scale-bar");
        const scaleBarDiv = scaleBarBox.querySelector("div"); // find first div (scale line/bar) in scale bar component
        if (!scaleBarDiv) {
            throw new Error("OpenLayers Scale Line not rendered");
        }

        return { scaleBarBox, scaleBarDiv };
    });

    return { scaleBarBox, scaleBarDiv };
}
