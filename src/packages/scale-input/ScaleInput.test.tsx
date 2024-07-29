// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { get } from "ol/proj";
import { ScaleInput } from "./ScaleInput";
import View from "ol/View";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";

//TODO more tests

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
    expect(inputSelect.tagName).toBe("SELECT");
});

it("should successfully create a scale input component with additional css classes and box properties", async () => {
    const { mapId, registry } = await setupMap();

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

    const { inputOptions } = await waitForScaleInput();
    expect(inputOptions.textContent).toBe("1 : 21,026");

    result.rerender(
        <PackageContextProvider services={injectedServices} locale="de">
            <ScaleInput mapId={mapId} data-testid="scale-input" />
        </PackageContextProvider>
    );
    expect(inputOptions.textContent).toBe("1 : 21.026");
});

async function waitForScaleInput() {
    const { inputDiv, inputSelect, inputOptions } = await waitFor(async () => {
        const inputDiv = await screen.findByTestId("scale-input");
        const inputSelect = inputDiv.querySelector("select"); // find first HTMLParagraphElement (scale select) in scale input component
        if (!inputSelect) {
            throw new Error("scale select not rendered");
        }
        const inputOptions = inputSelect.querySelector("option"); // find first HTMLParagraphElement (scale options) in scale input component
        if (!inputOptions) {
            throw new Error("scale options not rendered");
        }

        return { inputDiv, inputSelect, inputOptions };
    });

    return { inputDiv, inputSelect, inputOptions };
}
