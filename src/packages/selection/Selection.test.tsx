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

// Mögliche Test-Cases:
// Selectionsquellen aus Komponente auslesen und prüfen, ob das dieselben Quellen sind, die man übergeben hat
// testen, ob die Quelle in der GUI disabled und einen Warnhinweis(icon) hat, wenn die Quelle den Status "not available" hat
// testen, ob die Änderung des Status einer Quelle sich auch in der GUI widerspiegelt
// testen, dass der DragController direkt gestartet wird, wenn Komponente aktiviert wurde
// testen, ob standardmäßig die Rechteck-Selection als Selektionsmethode aktiv ist
// wenn mehrere Selection Methoden vorhanden sind, testen, ob in der GUI dann ein React-select mit den Methoden erscheint
// testen, ob im Fehlerfall eine Notifier-error Message geschmissen wird

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
