// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { NaviHistoryBackward, NaviHistoryForward } from "./NaviHistory";
import { ViewHistoryModel } from "./ViewHistoryModel";
import { setupMap } from "@open-pioneer/map-test-utils";

it("should successfully create an view history navigation component", async () => {
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const viewModel = new ViewHistoryModel(map);

    render(
        <PackageContextProvider>
            <NaviHistoryBackward viewModel={viewModel} data-testid="navi-history-back" />
            <NaviHistoryForward viewModel={viewModel} data-testid="navi-history-for" />
        </PackageContextProvider>
    );

    const { naviHistoryDivForward, naviHistoryDivBackward } = await waitForNaviHistoryComponent();

    // Parent element
    expect(naviHistoryDivForward.tagName).toBe("BUTTON");
    expect(naviHistoryDivBackward.tagName).toBe("BUTTON");
    expect(naviHistoryDivForward).toMatchSnapshot();
    expect(naviHistoryDivBackward).toMatchSnapshot();
});

//TODO tests

async function waitForNaviHistoryComponent() {
    const naviHistoryDivForward = await screen.findByTestId("navi-history-for");
    const naviHistoryDivBackward = await screen.findByTestId("navi-history-back");
    return { naviHistoryDivForward, naviHistoryDivBackward };
}
