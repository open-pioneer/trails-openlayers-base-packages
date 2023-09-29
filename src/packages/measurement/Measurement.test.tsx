// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { render, screen, waitFor } from "@testing-library/react";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { Measurement } from "./Measurement";
import { expect, it } from "vitest";
import { HTMLInputElement } from "happy-dom";

it("should successfully create a measurement component", async () => {
    render(
        <PackageContextProvider>
            <div data-testid="base">
                <Measurement></Measurement>
            </div>
        </PackageContextProvider>
    );

    // measurement is mounted
    const { measurementDiv, switchesDiv, switchInputs } = await waitForMeasurement();
    expect(measurementDiv).toMatchSnapshot();

    // check measurement switches box and input are available
    expect(switchesDiv).toBeInstanceOf(HTMLDivElement);
    expect(switchInputs[0]).toBeInstanceOf(HTMLInputElement);
});

it("should successfully create a measurement component with additional css classes and box properties", async () => {
    render(
        <PackageContextProvider>
            <div data-testid="base">
                <Measurement className="test" pl="1px"></Measurement>
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

//todo: write test for state change of the switches, update readme

async function waitForMeasurement() {
    const { measurementDiv, switchesDiv, switchInputs } = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");

        const measurementDiv = domElement.querySelector(".measurement");
        if (!measurementDiv) {
            throw new Error("Measurement not rendered");
        }

        const switchesDiv = measurementDiv.querySelector(".measurement-content");
        if (!switchesDiv) {
            throw new Error("Measurement switches container not rendered");
        }

        const measureDistanceSwitchInput = switchesDiv.querySelector("#measure-distance");
        const measureAreaSwitchInput = switchesDiv.querySelector("#measure-area");

        if (!measureDistanceSwitchInput || !measureAreaSwitchInput) {
            throw new Error("Measurement switch input not rendered");
        }

        const switchInputs = [measureDistanceSwitchInput, measureDistanceSwitchInput];

        return { measurementDiv, switchesDiv, switchInputs };
    });

    return { measurementDiv, switchesDiv, switchInputs };
}
