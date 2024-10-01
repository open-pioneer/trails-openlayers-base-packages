// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, act } from "@testing-library/react";
import { expect, it } from "vitest";
import { HistoryBackward, HistoryForward } from "./History";
import { ViewHistoryModel } from "./ViewHistoryModel";
import { setupMap } from "@open-pioneer/map-test-utils";
import userEvent from "@testing-library/user-event";

it("should successfully create an view history navigation component", async () => {
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const viewModel = new ViewHistoryModel(map);

    render(
        <PackageContextProvider>
            <HistoryBackward viewModel={viewModel} data-testid="navi-history-back" />
            <HistoryForward viewModel={viewModel} data-testid="navi-history-for" />
        </PackageContextProvider>
    );

    const { naviHistoryDivForward, naviHistoryDivBackward } = await waitForNaviHistoryComponent();

    // Parent elements
    expect(naviHistoryDivForward.tagName).toBe("BUTTON");
    expect(naviHistoryDivBackward.tagName).toBe("BUTTON");
    expect(naviHistoryDivForward).toMatchSnapshot();
    expect(naviHistoryDivBackward).toMatchSnapshot();
});

it("should successfully disable/enable buttons", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const viewModel = new ViewHistoryModel(map);

    render(
        <PackageContextProvider>
            <HistoryBackward viewModel={viewModel} data-testid="navi-history-back" />
            <HistoryForward viewModel={viewModel} data-testid="navi-history-for" />
        </PackageContextProvider>
    );
    await act(async () => {
        map.olMap.dispatchEvent("moveend");
    });

    const view = map.olMap.getView();
    if (!view) {
        throw new Error("view not defined");
    }

    const initialZoom = view.getZoom();
    if (!initialZoom) {
        throw new Error("zoom not defined");
    }

    const { naviHistoryDivForward, naviHistoryDivBackward } = await waitForNaviHistoryComponent();
    expect(naviHistoryDivForward.disabled).toBe(true);
    expect(naviHistoryDivBackward.disabled).toBe(true);

    await act(async () => {
        map.olMap.getView().setZoom(initialZoom + 1);
        map.olMap.dispatchEvent("moveend");
    });
    expect(naviHistoryDivForward.disabled).toBe(true);
    expect(naviHistoryDivBackward.disabled).toBe(false);

    await act(async () => {
        map.olMap.getView().setCenter([1489200, 6894026]);
        map.olMap.dispatchEvent("moveend");
    });
    expect(naviHistoryDivForward.disabled).toBe(true);
    expect(naviHistoryDivBackward.disabled).toBe(false);

    await user.click(naviHistoryDivBackward);
    expect(naviHistoryDivForward.disabled).toBe(false);
    expect(naviHistoryDivBackward.disabled).toBe(false);

    await user.click(naviHistoryDivBackward);
    expect(naviHistoryDivForward.disabled).toBe(false);
    expect(naviHistoryDivBackward.disabled).toBe(true);

    await act(async () => {
        map.olMap.getView().setCenter([1234500, 6894026]);
        map.olMap.dispatchEvent("moveend");
    });
    expect(naviHistoryDivForward.disabled).toBe(true);
    expect(naviHistoryDivBackward.disabled).toBe(false);
});

it("should successfully change the map view on forward", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const viewModel = new ViewHistoryModel(map);

    render(
        <PackageContextProvider>
            <HistoryBackward viewModel={viewModel} data-testid="navi-history-back" />
            <HistoryForward viewModel={viewModel} data-testid="navi-history-for" />
        </PackageContextProvider>
    );

    const { naviHistoryDivForward, naviHistoryDivBackward } = await waitForNaviHistoryComponent();

    const view = map.olMap.getView();
    if (!view) {
        throw new Error("view not defined");
    }

    const initialZoom = view.getZoom();
    if (!initialZoom) {
        throw new Error("zoom not defined");
    }

    await act(async () => {
        map.olMap.getView().setZoom(initialZoom + 1);
        map.olMap.dispatchEvent("moveend");
    });
    await act(async () => {
        map.olMap.getView().setCenter([1489200, 6894026]);
        map.olMap.dispatchEvent("moveend");
    });
    await act(async () => {
        map.olMap.getView().setCenter([1100000, 6100000]);
        map.olMap.dispatchEvent("moveend");
    });
    await user.click(naviHistoryDivBackward);

    const tempViewCenter = map.olMap.getView().getCenter();
    const tempViewZoom = map.olMap.getView().getZoom();

    await user.click(naviHistoryDivBackward);
    await user.click(naviHistoryDivForward);

    const actView = map.olMap.getView();
    expect(actView.getCenter()).toBe(tempViewCenter);
    expect(actView.getZoom()).toBe(tempViewZoom);
});

it("should successfully change the map view on backward", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const viewModel = new ViewHistoryModel(map);

    render(
        <PackageContextProvider>
            <HistoryBackward viewModel={viewModel} data-testid="navi-history-back" />
            <HistoryForward viewModel={viewModel} data-testid="navi-history-for" />
        </PackageContextProvider>
    );

    const { naviHistoryDivBackward } = await waitForNaviHistoryComponent();

    const view = map.olMap.getView();
    if (!view) {
        throw new Error("view not defined");
    }

    const initialZoom = view.getZoom();
    if (!initialZoom) {
        throw new Error("zoom not defined");
    }

    await act(async () => {
        map.olMap.getView().setZoom(initialZoom + 1);
        map.olMap.dispatchEvent("moveend");
    });
    await act(async () => {
        map.olMap.getView().setCenter([1900000, 6900000]);
        map.olMap.dispatchEvent("moveend");
    });

    const tempViewCenter = map.olMap.getView().getCenter();
    const tempViewZoom = map.olMap.getView().getZoom();

    await act(async () => {
        map.olMap.getView().setCenter([1500000, 6500000]);
        map.olMap.dispatchEvent("moveend");
    });
    await user.click(naviHistoryDivBackward);

    const actView = map.olMap.getView();
    expect(actView.getCenter()).toBe(tempViewCenter);
    expect(actView.getZoom()).toBe(tempViewZoom);
});

async function waitForNaviHistoryComponent() {
    const naviHistoryDivForward = (await screen.findByTestId(
        "navi-history-for"
    )) as HTMLButtonElement;

    const naviHistoryDivBackward = (await screen.findByTestId(
        "navi-history-back"
    )) as HTMLButtonElement;

    return { naviHistoryDivForward, naviHistoryDivBackward };
}
