// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { get } from "ol/proj";
import { ScaleSetter } from "./ScaleSetter";
import View from "ol/View";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";

it("should successfully create a scale Setter component", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <ScaleSetter mapId={mapId} data-testid="scale-setter" />
        </PackageContextProvider>
    );

    // scale Setter is mounted
    const { setterDiv, setterSelect } = await waitForScaleSetter();
    expect(setterDiv).toMatchSnapshot();

    // check scale setter box is available
    expect(setterSelect.tagName).toBe("SELECT");
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

    const { setterOptions } = await waitForScaleSetter();
    expect(setterOptions.textContent).toBe("1 : 21,026");

    result.rerender(
        <PackageContextProvider services={injectedServices} locale="de">
            <ScaleSetter mapId={mapId} data-testid="scale-setter" />
        </PackageContextProvider>
    );
    expect(setterOptions.textContent).toBe("1 : 21.026");
});

async function waitForScaleSetter() {
    const { setterDiv, setterSelect, setterOptions } = await waitFor(async () => {
        const setterDiv = await screen.findByTestId("scale-setter");
        const setterSelect = setterDiv.querySelector("select"); // find first HTMLParagraphElement (scale select) in scale setter component
        if (!setterSelect) {
            throw new Error("scale select not rendered");
        }
        const setterOptions = setterSelect.querySelector("option"); // find first HTMLParagraphElement (scale options) in scale setter component
        if (!setterOptions) {
            throw new Error("scale options not rendered");
        }

        return { setterDiv, setterSelect, setterOptions };
    });

    return { setterDiv, setterSelect, setterOptions };
}
