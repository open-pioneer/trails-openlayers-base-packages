// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SimpleLayer } from "@open-pioneer/map";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, getByRole, render, screen, waitFor } from "@testing-library/react";
import { Selection, SelectionSourceChangedEvent } from "./Selection";
import { FakePointSelectionSource, NoStatusSelectionSource } from "./test-utils";
import { VectorLayerSelectionSourceImpl } from "./VectorSelectionSource";
import { NotificationService } from "@open-pioneer/notifier";
import { Point } from "ol/geom";
import { SelectionSource } from "./api";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { disableReactActWarnings } from "test-utils";

beforeEach(() => {
    disableReactActWarnings();
});

afterEach(() => {
    vi.restoreAllMocks();
});

it("should successfully create a selection component and select the first selection source", async () => {
    await createSelection();
    const { selectionDiv } = await waitForSelection();
    expect(selectionDiv).toMatchSnapshot();
});

it("Sources read from component should be the same as the provided sources", async () => {
    const ALL_EXPECTED_FEATURES = [new Point([407354, 5754673]), new Point([404740, 5757893])];
    const POINT_SOURCE = new FakePointSelectionSource(0, "available", ALL_EXPECTED_FEATURES);

    await createSelection([POINT_SOURCE]);
    const { selectTrigger } = await waitForSelection();
    await openOptions(selectTrigger);

    const options = getOptions();
    const option = options[0];

    expect(options.length).equals(1);
    expect(option?.textContent).toBe(POINT_SOURCE.label);
});

it("Should disable option and show warning icon for unavailable sources", async () => {
    const ALL_EXPECTED_FEATURES = [new Point([407354, 5754673]), new Point([404740, 5757893])];
    const POINT_SOURCE = new FakePointSelectionSource(0, "unavailable", ALL_EXPECTED_FEATURES);

    await createSelection([POINT_SOURCE]);
    const { selectionDiv, selectTrigger } = await waitForSelection();
    await openOptions(selectTrigger);

    const options = getOptions();
    const option = options[0]!;
    const warningIcon = selectionDiv.querySelector(".warning-icon");

    expect(warningIcon).not.toBeNull();
    expect(warningIcon).toBeDefined();
    expect(option.getAttribute("aria-disabled")).toBe("true");
});

it("Should fire selection source change events when the user selects a different source", async () => {
    const source1 = createTestSelectionSource("layer1", "Source 1");
    const source2 = createTestSelectionSource("layer2", "Source 2");
    const onSourceChanged = vi.fn();

    await createSelection([source1, source2], onSourceChanged);
    expect(onSourceChanged).toHaveBeenCalledTimes(1);
    expect(onSourceChanged.mock.lastCall![0]!.source).toBe(source1);

    const { selectTrigger, getCurrentSelection } = await waitForSelection();
    expect(getCurrentSelection()).toBe("Source 1");

    await openOptions(selectTrigger);
    const option2 = getOptions()[1]!;
    expect(option2.textContent).toBe("Source 2");

    await act(() => {
        // For some reason userEvent.click does not work here.
        fireEvent.click(option2);
    });
    expect(getCurrentSelection()).toBe("Source 2");
    expect(onSourceChanged).toHaveBeenCalledTimes(2);
    expect(onSourceChanged.mock.lastCall![0]!.source).toBe(source2);
});

it("Should disable or enable selection option when changing the status of a source layer", async () => {
    const layer = new SimpleLayer({
        id: "ogc_kitas",
        title: "Kindertagesstätten",
        visible: false,
        olLayer: createKitasLayer()
    });

    const layerSelectionSource = new VectorLayerSelectionSourceImpl(
        layer.olLayer as VectorLayer<VectorSource, Feature>,
        layer.title,
        "Layer not visible"
    );
    await createSelection([layerSelectionSource]);
    const { selectTrigger } = await waitForSelection();

    await openOptions(selectTrigger);
    const initialOption = getOptions()[0]!;
    expect(initialOption.getAttribute("aria-disabled")).toBe("true");

    act(() => {
        layer.setVisible(true);
    });

    await waitFor(() => {
        const updatedOption = getOptions()[0]!;
        expect(updatedOption.getAttribute("aria-disabled")).toBeFalsy();
    });
});

it("expect selection source with no defined status is still available", async () => {
    const noStatusSelectionSource = new NoStatusSelectionSource();
    await createSelection([noStatusSelectionSource]);
    const { selectTrigger } = await waitForSelection();
    await openOptions(selectTrigger);

    const options = getOptions();
    const option = options[0]!;
    expect(option.getAttribute("aria-disabled")).toBeFalsy();
});

it("retains the selected source if the sources change but the selected source still exits", async () => {
    const layerSelectionSource = createTestSelectionSource("ogc_kitas", "Kindertagesstätten");
    const layerSelectionSource2 = createTestSelectionSource("ogc_kitas2", "Layer 2");

    const rerender = await createSelection([layerSelectionSource, layerSelectionSource2]);

    rerender.rerenderWithSources([layerSelectionSource]); // keep currently selected source

    const { selectTrigger } = await waitForSelection();
    const sourceValue = selectTrigger.getElementsByClassName("selection-source-value");
    const text = sourceValue[0]?.textContent;

    expect(text).toBe("Kindertagesstätten");
});

it("selects no selection source if the sources change and the currently selected source no longer exists", async () => {
    const layerSelectionSource = createTestSelectionSource("ogc_kitas", "Kindertagesstätten");
    const layerSelectionSource2 = createTestSelectionSource("ogc_kitas2", "Layer 2");

    const onSourceChanged = vi.fn();
    const rerender = await createSelection(
        [layerSelectionSource, layerSelectionSource2],
        onSourceChanged
    );

    const { getCurrentSelection } = await waitForSelection();
    expect(getCurrentSelection()).toBe("Kindertagesstätten");

    // Event handler called for initial selection
    expect(onSourceChanged).toHaveBeenCalledTimes(1);
    expect(onSourceChanged.mock.lastCall![0]!.source).toBe(layerSelectionSource);

    rerender.rerenderWithSources([layerSelectionSource2]); // remove currently selected source
    expect(getCurrentSelection()).toBe(undefined);

    // Event handler called for reset
    expect(onSourceChanged).toHaveBeenCalledTimes(2);
    expect(onSourceChanged.mock.lastCall![0]!.source).toBe(undefined);
});

async function createSelection(
    selectionSources?: SelectionSource[] | undefined,
    onSourceChanged?: (event: SelectionSourceChangedEvent) => void
) {
    const { map, registry } = await setupMap();

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

    const renderSelection = (sources: SelectionSource[]) => {
        return (
            <PackageContextProvider services={injectedServices}>
                <Selection
                    data-testid="selection"
                    map={map}
                    sources={sources}
                    onSelectionSourceChanged={onSourceChanged ?? (() => {})}
                />
            </PackageContextProvider>
        );
    };

    const { rerender } = render(renderSelection(sources));

    return {
        rerenderWithSources(newSources: SelectionSource[]) {
            rerender(renderSelection(newSources));
        }
    };
}

async function waitForSelection() {
    return await waitFor(async () => {
        const selectionDiv = await screen.findByTestId<HTMLDivElement>("selection");
        if (!selectionDiv) {
            throw new Error("Selection not rendered");
        }

        const selectTrigger = getByRole(selectionDiv, "combobox");
        return {
            selectionDiv,
            selectTrigger,
            getCurrentSelection() {
                // The dom element here is not stable so we're looking it up again every time.
                const value = selectionDiv.getElementsByClassName("selection-source-value")[0];
                return value?.textContent;
            }
        };
    });
}

async function openOptions(selectTrigger: HTMLElement) {
    act(() => {
        if (selectTrigger.dataset.state !== "open") {
            fireEvent.click(selectTrigger);
        }
    });

    await waitFor(() => {
        const optionsDiv = document.querySelector(".selection-source-options");
        if (!optionsDiv) {
            throw new Error("Options did not mount");
        }
    });
}

function getOptions() {
    return Array.from(
        document.body.getElementsByClassName("selection-source-option")
    ) as HTMLElement[];
}

function createTestSelectionSource(id: string, title: string, visibility: boolean = true) {
    const layer = new SimpleLayer({
        id: id,
        title: title,
        visible: visibility,
        olLayer: createKitasLayer()
    });
    return new VectorLayerSelectionSourceImpl(
        layer.olLayer as VectorLayer<VectorSource, Feature>,
        layer.title,
        "Layer not visible"
    );
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
