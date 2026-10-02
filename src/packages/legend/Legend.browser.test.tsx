// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { createTestOlLayer, setupMap, SimpleMapOptions } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { ReactNode } from "react";
import { disableReactActWarnings } from "test-utils";
import { beforeEach, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { Legend } from "./Legend";

beforeEach(() => {
    disableReactActWarnings();
});

it("should successfully create a legend component", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: createTestOlLayer(),
                isBaseLayer: true
            },
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer()
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: createTestOlLayer()
            }
        ]
    });

    await render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });
    const legend = await findLegend();
    expect(legend.getByRole("listitem").elements()).toHaveLength(0);
});

async function findLegend() {
    const legend = page.getByTestId("legend");
    await expect.element(legend.getByRole("list")).toBeInTheDocument();
    return legend;
}

async function setup(options: SimpleMapOptions & { returnMap?: true }) {
    const { map } = await setupMap(options);

    function Wrapper(props: { children?: ReactNode }) {
        return <PackageContextProvider {...props} />;
    }

    return { map, Wrapper };
}
