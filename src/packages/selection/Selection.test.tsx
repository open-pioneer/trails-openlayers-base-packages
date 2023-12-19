// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, it, vi } from "vitest";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen } from "@testing-library/react";
import { Selection, SelectionCompleteEvent, SelectionSourceChangedEvent } from "./Selection";
import { FakePointSelectionSource } from "./testSources";
import { NotificationService } from "@open-pioneer/notifier";

afterEach(() => {
    vi.restoreAllMocks();
});

it("should successfully create a selection component", async () => {
    await createSelection();
    const { selectionDiv } = await waitForSelection();
    expect(selectionDiv).toMatchSnapshot();
});

async function createSelection() {
    const { mapId, registry } = await setupMap();

    const notifier: Partial<NotificationService> = {
        notify() {
            throw new Error("not implemented");
        }
    };

    const injectedServices = createServiceOptions({
        registry
    });
    injectedServices["notifier.NotificationService"] = notifier;
    const sources = [new FakePointSelectionSource()];
    render(
        <PackageContextProvider services={injectedServices}>
            <Selection
                data-testid="selection"
                mapId={mapId}
                sources={sources}
                onSelectionComplete={onSelectionComplete}
                onSelectionSourceChanged={onSelectionSourceChanged}
            ></Selection>
        </PackageContextProvider>
    );
}

async function waitForSelection() {
    const selectionDiv = await screen.findByTestId<HTMLDivElement>("selection");
    return { selectionDiv };
}

function onSelectionComplete(event: SelectionCompleteEvent) {
    const geometries = event.results.map((result) => result.geometry);
    return geometries;
}

function onSelectionSourceChanged(_: SelectionSourceChangedEvent) {
    return;
}
