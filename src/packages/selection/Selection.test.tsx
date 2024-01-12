// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, it, vi } from "vitest";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Selection, SelectionCompleteEvent, SelectionSourceChangedEvent } from "./Selection";
import { FakePointSelectionSource, NoStatusSelectionSource } from "./testSources";
import { VectorLayerSelectionSource } from "./testSources";
import { NotificationService } from "@open-pioneer/notifier";
import { Point } from "ol/geom";
import { SelectionSource } from "./api";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import { SimpleLayer } from "@open-pioneer/map";

afterEach(() => {
    vi.restoreAllMocks();
});

it("should successfully create a selection component", async () => {
    await createSelection();
    const { selectionDiv } = await waitForSelection();
    expect(selectionDiv).toMatchSnapshot();
});

it("Sources read from component should be the same as the provided sources", async () => {
    const ALL_EXPECTED_FEATURES = [new Point([407354, 5754673]), new Point([404740, 5757893])];
    const POINT_SOURCE = new FakePointSelectionSource(0, "available", ALL_EXPECTED_FEATURES);

    await createSelection([POINT_SOURCE]);
    const { selectElement } = await waitForSelection();
    openOptions(selectElement);

    const options = getOptions(selectElement);
    const option = options[0];

    expect(options.length).equals(1);
    expect(option?.textContent).toBe(POINT_SOURCE.label);
});

it("Should disable option and show warning icon for unavailable sources", async () => {
    const ALL_EXPECTED_FEATURES = [new Point([407354, 5754673]), new Point([404740, 5757893])];
    const POINT_SOURCE = new FakePointSelectionSource(0, "unavailable", ALL_EXPECTED_FEATURES);

    await createSelection([POINT_SOURCE]);
    const { selectionDiv, selectElement } = await waitForSelection();
    openOptions(selectElement);

    const options = getOptions(selectElement);
    const option = options[0];
    const warningIcon = selectionDiv.querySelector(".warning-icon");

    expect(warningIcon).not.toBeNull();
    expect(warningIcon).toBeDefined();
    expect(option?.classList.contains("react-select__option--is-disabled")).toBeTruthy();
});

it("Should disable or enable selection option when changing the status of a source layer", async () => {
    const layer = new SimpleLayer({
        id: "ogc_kitas",
        title: "Kindertagesstätten",
        visible: false,
        olLayer: createKitasLayer()
    });

    layer.olLayer.setVisible(false);

    const layerSelectionSource = new VectorLayerSelectionSource(
        layer.olLayer as VectorLayer<VectorSource>,
        layer.title,
        "Layer not visible"
    );
    await createSelection([layerSelectionSource]);
    const { selectElement } = await waitForSelection();
    openOptions(selectElement);

    const options = getOptions(selectElement);
    const option = options[0];
    expect(option?.classList.contains("react-select__option--is-disabled")).toBeTruthy();

    act(() => {
        layer.olLayer.setVisible(true);
    });
    openOptions(selectElement);
    expect(option?.classList.contains("react-select__option--is-disabled")).toBeFalsy();
});

it("expect selection source with no defined status is still available", async () => {
    const noStatusSelectionSource = new NoStatusSelectionSource();
    await createSelection([noStatusSelectionSource]);
    const { selectElement } = await waitForSelection();
    openOptions(selectElement);

    const options = getOptions(selectElement);
    const option = options[0];
    expect(option?.classList.contains("react-select__option--is-disabled")).toBeFalsy();
});

async function createSelection(selectionSources?: SelectionSource[] | undefined) {
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
    const sources = selectionSources || [new FakePointSelectionSource()];
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
    const { selectionDiv, selectElement } = await waitFor(async () => {
        const selectionDiv = await screen.findByTestId<HTMLDivElement>("selection");
        if (!selectionDiv) {
            throw new Error("Selection not rendered");
        }

        const selectElement: HTMLSelectElement | null =
            selectionDiv.querySelector(".selection-source");
        if (!selectElement) {
            throw new Error("Select element not rendered");
        }

        return { selectionDiv, selectElement };
    });

    return { selectionDiv, selectElement };
}

function openOptions(selectElement: HTMLSelectElement) {
    act(() => {
        fireEvent.keyDown(selectElement, { key: "ArrowDown" });
    });
}

function getOptions(selectElement: HTMLSelectElement) {
    return Array.from(
        selectElement.getElementsByClassName("selection-source-option")
    ) as HTMLElement[];
}

function createKitasLayer() {
    const geojsonSource = new VectorSource({
        url: "https://ogc-api.nrw.de/inspire-us-kindergarten/v1/collections/governmentalservice/items?f=json&limit=10000",
        format: new GeoJSON(), //assign GeoJson parser
        attributions:
            '&copy; <a href="http://www.bkg.bund.de" target="_blank">Bundesamt f&uuml;r Kartographie und Geod&auml;sie</a> 2017, <a href="http://sg.geodatenzentrum.de/web_public/Datenquellen_TopPlus_Open.pdf" target="_blank">Datenquellen</a>'
    });

    return new VectorLayer({
        source: geojsonSource
    });
}

function onSelectionComplete(event: SelectionCompleteEvent) {
    const geometries = event.results.map((result) => result.geometry);
    return geometries;
}

function onSelectionSourceChanged(_: SelectionSourceChangedEvent) {
    return;
}
