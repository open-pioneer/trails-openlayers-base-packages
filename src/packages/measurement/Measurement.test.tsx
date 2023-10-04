// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { Measurement } from "./Measurement";
import { expect, it } from "vitest";

it("should successfully create a measurement component", async () => {
    render(
        <PackageContextProvider>
            <div data-testid="base">
                <Measurement active={true}></Measurement>
            </div>
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
    render(
        <PackageContextProvider>
            <div data-testid="base">
                <Measurement active={true} className="test" pl="1px"></Measurement>
            </div>
        </PackageContextProvider>
    );

    // measurement is mounted
    const { measurementDiv } = await waitForMeasurement();
    expect(measurementDiv).toMatchSnapshot();

    expect(measurementDiv.classList.contains("test")).toBe(true);
    expect(measurementDiv.classList.contains("foo")).toBe(false);

    const styles = window.getComputedStyle(measurementDiv);
    expect(styles.paddingLeft).toBe("1px");
});

it("should successfully select a measurement from the select dropdown", async () => {
    render(
        <PackageContextProvider>
            <div data-testid="base">
                <Measurement active={true} className="test" pl="1px"></Measurement>
            </div>
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

async function waitForMeasurement() {
    const { measurementDiv, measurementSelectDiv, measurementSelect } = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");

        const measurementDiv = domElement.querySelector(".measurement");
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
