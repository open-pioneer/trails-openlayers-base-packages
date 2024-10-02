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

    const { historyDivForward, historyDivBackward } = await waitForHistoryComponent();

    // Parent elements
    expect(historyDivForward.tagName).toBe("BUTTON");
    expect(historyDivBackward.tagName).toBe("BUTTON");
    expect(historyDivForward).toMatchSnapshot();
    expect(historyDivBackward).toMatchSnapshot();
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

    const { historyDivForward, historyDivBackward } = await waitForHistoryComponent();
    expect(historyDivForward.disabled).toBe(true);
    expect(historyDivBackward.disabled).toBe(true);

    await act(async () => {
        map.olMap.getView().setZoom(initialZoom + 1);
        map.olMap.dispatchEvent("moveend");
    });
    expect(historyDivForward.disabled).toBe(true);
    expect(historyDivBackward.disabled).toBe(false);

    await act(async () => {
        map.olMap.getView().setCenter([1489200, 6894026]);
        map.olMap.dispatchEvent("moveend");
    });
    expect(historyDivForward.disabled).toBe(true);
    expect(historyDivBackward.disabled).toBe(false);

    await user.click(historyDivBackward);
    expect(historyDivForward.disabled).toBe(false);
    expect(historyDivBackward.disabled).toBe(false);

    await user.click(historyDivBackward);
    expect(historyDivForward.disabled).toBe(false);
    expect(historyDivBackward.disabled).toBe(true);

    await act(async () => {
        map.olMap.getView().setCenter([1234500, 6894026]);
        map.olMap.dispatchEvent("moveend");
    });
    expect(historyDivForward.disabled).toBe(true);
    expect(historyDivBackward.disabled).toBe(false);
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

    const { historyDivForward, historyDivBackward } = await waitForHistoryComponent();

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
    await user.click(historyDivBackward);

    const tempViewCenter = map.olMap.getView().getCenter();
    const tempViewZoom = map.olMap.getView().getZoom();

    await user.click(historyDivBackward);
    await user.click(historyDivForward);

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

    const { historyDivBackward } = await waitForHistoryComponent();

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
    await user.click(historyDivBackward);

    const actView = map.olMap.getView();
    expect(actView.getCenter()).toBe(tempViewCenter);
    expect(actView.getZoom()).toBe(tempViewZoom);
});

async function waitForHistoryComponent() {
    const historyDivForward = (await screen.findByTestId("navi-history-for")) as HTMLButtonElement;

    const historyDivBackward = (await screen.findByTestId(
        "navi-history-back"
    )) as HTMLButtonElement;

    return { historyDivForward, historyDivBackward };
}
