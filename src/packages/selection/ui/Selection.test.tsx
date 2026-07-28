// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { nextTick, reactive } from "@conterra/reactivity-core";
import { MapModel } from "@open-pioneer/map";
import { createTestLayer, setupMap } from "@open-pioneer/map-test-utils";
import { NotificationService } from "@open-pioneer/notifier";
import { PackageIntl } from "@open-pioneer/runtime";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, getByRole, render, screen, waitFor } from "@testing-library/react";
import { Feature } from "ol";
import { Extent } from "ol/extent";
import { fromExtent } from "ol/geom/Polygon";
import { DragBox } from "ol/interaction";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { ReactNode, useState } from "react";
import { disableReactActWarnings } from "test-utils";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SelectionSource } from "../api";
import { VectorLayerSelectionSourceImpl } from "../sources/VectorSelectionSource";
import { FakePointSelectionSource, NoStatusSelectionSource } from "../test-utils";
import { Selection, SelectionCompleteEvent, SelectionSourceChangedEvent } from "./Selection";

beforeEach(() => {
    disableReactActWarnings();
});

afterEach(() => {
    vi.restoreAllMocks();
});

it("renders the select control for the current selection source", async () => {
    const source: SelectionSource = {
        label: "Snapshot Source",
        status: "unavailable",
        select: async () => []
    };

    await createSelection({ sources: [source] });
    const { selectionDiv } = await waitForSelection();
    expect(selectionDiv).toMatchSnapshot();
});

it("shows the provided sources as options", async () => {
    const source = new FakePointSelectionSource();

    await createSelection({ sources: [source] });
    const { selectTrigger } = await waitForSelection();
    await openOptions(selectTrigger);

    const options = getOptions();
    expect(options.length).equals(1);
    expect(options[0]?.textContent).toBe(source.label);
});

it("selects the first source and reports it to the application", async () => {
    const source1 = createTestSelectionSource("layer1", "Source 1");
    const source2 = createTestSelectionSource("layer2", "Source 2");
    const onSourceChanged = vi.fn();

    await createSelection({ sources: [source1, source2], onSourceChanged });
    const { getCurrentSelection } = await waitForSelection();

    expect(getCurrentSelection()).toBe("Source 1");
    expect(onSourceChanged).toHaveBeenCalledTimes(1);
    expect(onSourceChanged.mock.lastCall![0]!.source).toBe(source1);
});

it("fires selection source change events when the user selects a different source", async () => {
    const source1 = createTestSelectionSource("layer1", "Source 1");
    const source2 = createTestSelectionSource("layer2", "Source 2");
    const onSourceChanged = vi.fn();

    await createSelection({ sources: [source1, source2], onSourceChanged });
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

it("keeps the selected source if the sources change but the selected source still exists", async () => {
    const source1 = createTestSelectionSource("ogc_kitas", "Kindertagesstätten");
    const source2 = createTestSelectionSource("ogc_kitas2", "Layer 2");
    const onSourceChanged = vi.fn();

    const { setSources } = await createSelection({
        sources: [source1, source2],
        onSourceChanged
    });
    const { getCurrentSelection } = await waitForSelection();
    expect(getCurrentSelection()).toBe("Kindertagesstätten");

    setSources([source1]); // keep currently selected source
    await vi.waitFor(() => {
        expect(getCurrentSelection()).toBe("Kindertagesstätten");
    });
    expect(onSourceChanged).toHaveBeenCalledTimes(1); // only the initial selection
});

it("clears the selection if the selected source is removed", async () => {
    const source1 = createTestSelectionSource("ogc_kitas", "Kindertagesstätten");
    const source2 = createTestSelectionSource("ogc_kitas2", "Layer 2");
    const onSourceChanged = vi.fn();

    const { setSources } = await createSelection({
        sources: [source1, source2],
        onSourceChanged
    });
    const { getCurrentSelection } = await waitForSelection();
    expect(getCurrentSelection()).toBe("Kindertagesstätten");

    setSources([source2]); // remove currently selected source
    await waitFor(() => expect(getCurrentSelection()).toBeUndefined());

    expect(onSourceChanged).toHaveBeenCalledTimes(2);
    expect(onSourceChanged.mock.lastCall![0]!.source).toBeUndefined();
});

it("disables the option of an unavailable source and shows a warning icon", async () => {
    const source = new FakePointSelectionSource(0, "unavailable");

    await createSelection({ sources: [source] });
    const { selectionDiv, selectTrigger } = await waitForSelection();
    await openOptions(selectTrigger);

    expect(getOptions()[0]!.getAttribute("aria-disabled")).toBe("true");
    expect(selectionDiv.querySelector(".warning-icon")).not.toBeNull();
});

it("enables the option again when the source becomes available", async () => {
    const source = new FakePointSelectionSource(0, "unavailable");

    await createSelection({ sources: [source] });
    const { selectTrigger } = await waitForSelection();

    await openOptions(selectTrigger);
    expect(getOptions()[0]!.getAttribute("aria-disabled")).toBe("true");

    act(() => {
        source.status = "available";
    });

    await waitFor(() => {
        expect(getOptions()[0]!.getAttribute("aria-disabled")).toBeFalsy();
    });
});

it("treats a source without a status as available", async () => {
    await createSelection({ sources: [new NoStatusSelectionSource()] });
    const { selectTrigger } = await waitForSelection();
    await openOptions(selectTrigger);

    expect(getOptions()[0]!.getAttribute("aria-disabled")).toBeFalsy();
});

it("reports the results when the user selects an extent on the map", async () => {
    const source = new FakePointSelectionSource(0, "available");
    const onSelectionComplete = vi.fn();

    const { map } = await createSelection({ sources: [source], onSelectionComplete });
    await waitForSelection();

    await vi.waitFor(() => {
        selectExtent(map, [404740, 5754673, 407354, 5757893]);
    });

    await waitFor(() => expect(onSelectionComplete).toHaveBeenCalledTimes(1));
    const event: SelectionCompleteEvent = onSelectionComplete.mock.lastCall![0];
    expect(event.source).toBe(source);
    expect(event.results.map((result) => result.id)).toEqual([0, 1]);
});

it("does not select anything while the current source is unavailable", async () => {
    const source = new FakePointSelectionSource(0, "unavailable");
    const onSelectionComplete = vi.fn();

    const { map } = await createSelection({ sources: [source], onSelectionComplete });
    await waitForSelection();
    await nextTick();

    expect(findDragBox(map)).toBeUndefined();
    expect(onSelectionComplete).not.toHaveBeenCalled();
});

interface CreateSelectionOptions {
    sources?: SelectionSource[];
    onSourceChanged?: (event: SelectionSourceChangedEvent) => void;
    onSelectionComplete?: (event: SelectionCompleteEvent) => void;
}

/**
 * Renders the selection component.
 *
 * The sources can be updated via the returned `setSources` function.
 */
async function createSelection(options?: CreateSelectionOptions) {
    const { map } = await setupMap({ advanced: { interactions: [], view: undefined } });
    const notifier: Partial<NotificationService> = {
        notify() {
            throw new Error("not implemented");
        }
    };

    let setSources!: (sources: SelectionSource[]) => void;
    function TestParent(props: { children: (sources: SelectionSource[]) => ReactNode }) {
        const [sources, updateSources] = useState(
            () => options?.sources ?? [new FakePointSelectionSource()]
        );
        setSources = updateSources;
        return props.children(sources);
    }

    render(
        <PackageContextProvider services={{ "notifier.NotificationService": notifier }}>
            <TestParent>
                {(sources) => (
                    <Selection
                        data-testid="selection"
                        map={map}
                        sources={sources}
                        onSelectionSourceChanged={options?.onSourceChanged}
                        onSelectionComplete={options?.onSelectionComplete}
                    />
                )}
            </TestParent>
        </PackageContextProvider>
    );

    return {
        map,
        setSources(sources: SelectionSource[]) {
            act(() => setSources(sources));
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

/** Simulates the user drawing a box on the map. */
function selectExtent(map: MapModel, extent: Extent): void {
    const dragBox = findDragBox(map);
    if (!dragBox) {
        throw new Error("No drag box interaction registered on the map.");
    }
    vi.spyOn(dragBox, "getGeometry").mockReturnValue(fromExtent(extent));
    dragBox.dispatchEvent("boxend");
}

function findDragBox(map: MapModel): DragBox | undefined {
    return map.olMap
        .getInteractions()
        .getArray()
        .find((interaction): interaction is DragBox => interaction instanceof DragBox);
}

function createTestSelectionSource(id: string, title: string) {
    const layer = createTestLayer({
        id,
        title,
        visible: true,
        olLayer: createVectorLayer()
    });
    return createSelectionSourceForLayer(
        layer.olLayer as VectorLayer<VectorSource, Feature>,
        layer.title
    );
}

let nextSourceId = 1;

function createSelectionSourceForLayer(
    olLayer: VectorLayer<VectorSource, Feature>,
    label = "Kindertagesstätten"
) {
    return new VectorLayerSelectionSourceImpl(
        `source-${nextSourceId++}`,
        olLayer,
        label,
        reactive({ formatMessage: () => "Layer not visible" } as unknown as PackageIntl)
    );
}

function createVectorLayer() {
    return new VectorLayer({
        source: new VectorSource()
    });
}
