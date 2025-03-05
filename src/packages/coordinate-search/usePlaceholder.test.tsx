// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { renderHook } from "@testing-library/react";
import { get as getProjection } from "ol/proj";
import { expect, it } from "vitest";
import { usePlaceholder } from "./usePlaceholder";

it("should format coordinates to correct coordinate string for the corresponding locale and precision", async () => {
    const coords = [6.859, 51.426];

    const renderCoords = (locale: string, precision = 2) => {
        return renderHook(
            () =>
                usePlaceholder(coords, getProjection("EPSG:4326")!, {
                    label: "EPSG:3857",
                    value: getProjection("EPSG:3857")!,
                    precision: precision
                }),
            {
                wrapper: (props) => <PackageContextProvider {...props} locale={locale} />
            }
        );
    };

    const hookEN = renderCoords("en");
    const stringCoordinates = hookEN.result.current;
    expect(stringCoordinates).equals("763,540.39 6,696,996.96");

    const hookDE = renderCoords("de", 3);
    expect(hookDE.result.current).equals("763.540,387 6.696.996,962");

    const hookDE_precision0 = renderCoords("de", 0);
    expect(hookDE_precision0.result.current).equals("763.540 6.696.997");
});
