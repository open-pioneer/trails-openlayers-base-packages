// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { expect, it } from "vitest";
import { createIntl } from "@open-pioneer/test-utils/vanilla";
import { PackageIntl } from "@open-pioneer/runtime";
import { formatCoordinates } from "./formatCoordinates";

const INTL_DE = createIntl({ locale: "de" });
const INTL_EN = createIntl({ locale: "en" });

it("should format coordinates to correct coordinate string for the corresponding locale and precision", async () => {
    const coords = [3545.08081, 4543543.009];

    const renderCoords = (intl: PackageIntl, precision = 2) => {
        return formatCoordinates(coords, precision, intl, undefined);
    };

    expect(renderCoords(INTL_EN)).equals("3,545.08 4,543,543.01");
    expect(renderCoords(INTL_DE, 3)).equals("3.545,081 4.543.543,009");
    expect(renderCoords(INTL_DE, 0)).equals("3.545 4.543.543");
});

it("should format coordinates to correct coordinate string with default precision", async () => {
    const coords = [3545.08081, 4543543.009];
    const formatted = formatCoordinates(coords, undefined, INTL_DE, undefined);
    expect(formatted).equals("3.545,0808 4.543.543,0090");
});
