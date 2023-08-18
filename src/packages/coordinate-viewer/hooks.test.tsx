// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { renderHook } from "@testing-library/react";
import { useFormatting } from "./hooks";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { expect, it } from "vitest";

/**
 * @vitest-environment jsdom
 */
it("should format coordinates to correct coordinate string for the corresponding locale", async () => {
    const coords = [3545.08081, 4543543.009];

    const optionsEN = { locale: "en" };
    const hook = renderHook(() => useFormatting(coords, 2), {
        wrapper: (props) => <PackageContextProvider {...props} {...optionsEN} />
    });
    const stringCoordinates = hook.result.current;
    expect(stringCoordinates).equals("3,545.08 4,543,543.01");

    const optionsDE = { locale: "de" };
    const hookDE = renderHook(() => useFormatting(coords, 3), {
        wrapper: (props) => <PackageContextProvider {...props} {...optionsDE} />
    });
    expect(hookDE.result.current).equals("3.545,081 4.543.543,009");
});

it("should format coordinates to correct coordinate string with default precision", async () => {
    const coords = [3545.08081, 4543543.009];
    const optionsDE = { locale: "de" };

    const hookDeWithoutPrecision = renderHook(() => useFormatting(coords, undefined), {
        wrapper: (props) => <PackageContextProvider {...props} {...optionsDE} />
    });
    expect(hookDeWithoutPrecision.result.current).equals("3.545,0808 4.543.543,0090");
});
