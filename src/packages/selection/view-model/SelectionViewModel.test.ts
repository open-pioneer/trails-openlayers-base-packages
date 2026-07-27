// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive } from "@conterra/reactivity-core";
import { MapModel } from "@open-pioneer/map";
import { setupMap } from "@open-pioneer/map-test-utils";
import { Extent } from "ol/extent";
import { fromExtent } from "ol/geom/Polygon";
import { DragBox, DragPan, Interaction } from "ol/interaction";
import { isValidElement } from "react";
import { afterEach, describe, expect, it, Mock, vi } from "vitest";
import {
    SelectionKind,
    SelectionOptions,
    SelectionResult,
    SelectionSource,
    SelectionSourceStatus
} from "../api";
import { getSourceStatus, Messages, SelectionViewModel } from "./SelectionViewModel";

const MESSAGES: Messages = {
    active: "ACTIVE",
    inactive: "INACTIVE",
    noSource: "NO_SOURCE"
};

const EXTENT: Extent = [404740, 5754673, 407354, 5757893];

afterEach(() => {
    vi.restoreAllMocks();
});

describe("current source", () => {
    it("selects nothing while there are no sources", async () => {
        const { viewModel } = await setup();
        expect(viewModel.sources).toEqual([]);
        expect(viewModel.currentSource).toBeUndefined();
    });

    it("selects the first source once sources become available", async () => {
        const { viewModel } = await setup();
        const source1 = new TestSource("Source 1");
        const source2 = new TestSource("Source 2");

        viewModel.sources = [source1, source2];
        expect(viewModel.currentSource).toBe(source1);
    });

    it("keeps the current source if it is still present after a source update", async () => {
        const source1 = new TestSource("Source 1");
        const source2 = new TestSource("Source 2");
        const { viewModel } = await setup({ sources: [source1, source2] });

        viewModel.currentSource = source2;
        viewModel.sources = [source2];
        expect(viewModel.currentSource).toBe(source2);
    });

    it("resets the current source if it was removed from the sources", async () => {
        const source1 = new TestSource("Source 1");
        const source2 = new TestSource("Source 2");
        const { viewModel } = await setup({ sources: [source1, source2] });
        expect(viewModel.currentSource).toBe(source1);

        viewModel.sources = [source2];
        expect(viewModel.currentSource).toBeUndefined();
    });

    it("resets the current source if all sources are removed", async () => {
        const source1 = new TestSource("Source 1");
        const { viewModel } = await setup({ sources: [source1] });

        viewModel.sources = [];
        expect(viewModel.currentSource).toBeUndefined();
    });

    it("supports switching to another known source", async () => {
        const source1 = new TestSource("Source 1");
        const source2 = new TestSource("Source 2");
        const { viewModel } = await setup({ sources: [source1, source2] });

        viewModel.currentSource = source2;
        expect(viewModel.currentSource).toBe(source2);
    });

    it("throws when selecting a source that is not in the list of sources", async () => {
        const source1 = new TestSource("Source 1");
        const { viewModel } = await setup({ sources: [source1] });

        expect(() => (viewModel.currentSource = new TestSource("Other"))).toThrow(
            /cannot select unknown selection source/
        );
    });

    it("throws when clearing the current source while sources are present", async () => {
        const source1 = new TestSource("Source 1");
        const { viewModel } = await setup({ sources: [source1] });

        expect(() => (viewModel.currentSource = undefined)).toThrow(
            /cannot select 'undefined' if there are sources present/
        );
    });

    it("throws when selecting a source while there are no sources", async () => {
        const { viewModel } = await setup();

        expect(() => (viewModel.currentSource = new TestSource("Source 1"))).toThrow(
            /can only select 'undefined' if there are no sources present/
        );
    });
});

describe("active state", () => {
    it("is inactive while no source is selected", async () => {
        const { viewModel } = await setup();
        expect(viewModel.isActive).toBe(false);
        expect(viewModel.ariaMessage).toBe(MESSAGES.noSource);
    });

    it("is active if the current source is available", async () => {
        const source = new TestSource("Source", "available");
        const { viewModel } = await setup({ sources: [source] });

        expect(viewModel.isActive).toBe(true);
        expect(viewModel.ariaMessage).toBe(MESSAGES.active);
    });

    it("is active if the current source does not define a status at all", async () => {
        const source: SelectionSource = { label: "Source", select: async () => [] };
        const { viewModel } = await setup({ sources: [source] });

        expect(viewModel.isActive).toBe(true);
    });

    it("is inactive if the current source is unavailable", async () => {
        const source = new TestSource("Source", "unavailable");
        const { viewModel } = await setup({ sources: [source] });

        expect(viewModel.isActive).toBe(false);
        expect(viewModel.ariaMessage).toBe(MESSAGES.inactive);
    });

    it("is inactive if the current source is unavailable via status object", async () => {
        const source = new TestSource("Source", { kind: "unavailable", reason: "nope" });
        const { viewModel } = await setup({ sources: [source] });

        expect(viewModel.isActive).toBe(false);
    });

    it("tracks the status of the current source", async () => {
        const source = new TestSource("Source", "unavailable");
        const { viewModel } = await setup({ sources: [source] });
        expect(viewModel.isActive).toBe(false);

        source.status = "available";
        expect(viewModel.isActive).toBe(true);
        expect(viewModel.ariaMessage).toBe(MESSAGES.active);
    });

    it("tracks the status of the new source after switching sources", async () => {
        const source1 = new TestSource("Source 1", "available");
        const source2 = new TestSource("Source 2", "unavailable");
        const { viewModel } = await setup({ sources: [source1, source2] });
        expect(viewModel.isActive).toBe(true);

        viewModel.currentSource = source2;
        expect(viewModel.isActive).toBe(false);
    });
});

describe("map interactions", () => {
    it("registers interactions on the map while the selection is active", async () => {
        const source = new TestSource("Source", "available");
        const { map } = await setup({ sources: [source] });

        await vi.waitFor(() => {
            expect(findInteraction(map, DragBox)).toBeDefined();
            expect(findInteraction(map, DragPan)).toBeDefined();
        });
    });

    it("does not register interactions while the selection is inactive", async () => {
        const source = new TestSource("Source", "unavailable");
        const { map } = await setup({ sources: [source] });

        await vi.waitFor(() => {
            expect(findInteraction(map, DragBox)).toBeUndefined();
        });
    });

    it("removes the interactions again when the selection becomes inactive", async () => {
        const source = new TestSource("Source", "available");
        const { map } = await setup({ sources: [source] });
        await vi.waitFor(() => {
            expect(findInteraction(map, DragBox)).toBeDefined();
        });

        source.status = "unavailable";
        await vi.waitFor(() => {
            expect(findInteraction(map, DragBox)).toBeUndefined();
            expect(findInteraction(map, DragPan)).toBeUndefined();
        });
    });

    it("removes the interactions when the view model is destroyed", async () => {
        const source = new TestSource("Source", "available");
        const { map, viewModel } = await setup({ sources: [source] });
        await vi.waitFor(() => {
            expect(findInteraction(map, DragBox)).toBeDefined();
        });

        viewModel.destroy();
        await vi.waitFor(() => {
            expect(findInteraction(map, DragPan)).toBeUndefined();
            expect(findInteraction(map, DragBox)).toBeUndefined();
        });
    });
});

describe("viewport", () => {
    it("marks the viewport with a css class matching the active state", async () => {
        const source = new TestSource("Source", "unavailable");
        const { map } = await setup({ sources: [source] });
        const viewport = map.olMap.getViewport();

        await vi.waitFor(() => {
            expect(viewport.classList.contains("selection-inactive")).toBe(true);
            expect(viewport.classList.contains("selection-active")).toBe(false);
        });

        source.status = "available";
        await vi.waitFor(() => {
            expect(viewport.classList.contains("selection-active")).toBe(true);
            expect(viewport.classList.contains("selection-inactive")).toBe(false);
        });
    });

    it("suppresses the viewport's context menu", async () => {
        const { map } = await setup();
        const event = new MouseEvent("contextmenu", { cancelable: true });
        map.olMap.getViewport().dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
    });

    it("restores the viewport when the view model is destroyed", async () => {
        const { map, viewModel } = await setup();
        const viewport = map.olMap.getViewport();
        await vi.waitFor(() => {
            expect(viewport.classList.contains("selection-inactive")).toBe(true);
        });

        viewModel.destroy();
        await vi.waitFor(() => {
            expect(viewport.classList.contains("selection-inactive")).toBe(false);
        });

        const event = new MouseEvent("contextmenu", { cancelable: true });
        viewport.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
    });
});

describe("tooltip", () => {
    it("shows the current aria message in a tooltip overlay", async () => {
        const source = new TestSource("Source", "unavailable");
        const { map, viewModel } = await setup({ sources: [source] });

        await vi.waitFor(() => {
            expect(getTooltipMessage(map)).toBe(MESSAGES.inactive);
        });

        source.status = "available";
        await vi.waitFor(() => {
            expect(viewModel.ariaMessage).toBe(MESSAGES.active);
            expect(getTooltipMessage(map)).toBe(MESSAGES.active);
        });
    });

    it("removes the tooltip overlay when the view model is destroyed", async () => {
        const { map, viewModel } = await setup();
        await vi.waitFor(() => {
            expect(findTooltip(map)).toBeDefined();
        });

        viewModel.destroy();
        await vi.waitFor(() => {
            expect(findTooltip(map)).toBeUndefined();
        });
    });
});

describe("selection", () => {
    it("queries the current source when the user selected an extent", async () => {
        const source = new TestSource("Source", "available");
        const { map, onComplete } = await setup({ sources: [source] });
        await vi.waitFor(() => {
            selectExtent(map, EXTENT);
        });
        await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));

        expect(source.calls).toHaveLength(1);
        const [kind, options] = source.calls[0]!;
        expect(kind).toEqual({ type: "extent", extent: EXTENT });
        expect(options.map).toBe(map);
        expect(options.mapProjection).toBe(map.projection);
        expect(options.maxResults).toBe(10000); // default
        expect(options.signal).toBeInstanceOf(AbortSignal);

        expect(onComplete).toHaveBeenCalledWith(source, source.results);
    });

    it("limits the results to 'maxResults'", async () => {
        const source = new TestSource("Source", "available");
        const { map, onComplete } = await setup({ sources: [source], maxResults: 1 });
        await vi.waitFor(() => {
            selectExtent(map, EXTENT);
        });
        await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
        expect(onComplete.mock.lastCall![1]).toEqual(source.results.slice(0, 1));
    });

    it("reports errors thrown by the source", async () => {
        const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
        const source = new TestSource("Broken", "available");
        source.select = async () => {
            throw new Error("boom");
        };

        const { map, onComplete, onError } = await setup({ sources: [source] });
        await vi.waitFor(() => {
            selectExtent(map, EXTENT);
        });
        await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));

        expect(onComplete).not.toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledOnce();
        expect(logSpy.mock.lastCall![0]).toMatchInlineSnapshot(
            `"[ERROR] selection:SelectionViewModel: selection from source Broken failed"`
        );
    });
});

describe("getSourceStatus", () => {
    it("treats a missing status as 'available'", () => {
        expect(getSourceStatus({ label: "x", select: async () => [] })).toEqual({
            kind: "available"
        });
    });

    it("normalizes plain string states", () => {
        expect(getSourceStatus(new TestSource("x", "available"))).toEqual({ kind: "available" });
        expect(getSourceStatus(new TestSource("x", "unavailable"))).toEqual({
            kind: "unavailable"
        });
    });

    it("returns status objects as they are", () => {
        const status = { kind: "unavailable", reason: "because" } as const;
        expect(getSourceStatus(new TestSource("x", status))).toBe(status);
    });
});

class TestSource implements SelectionSource {
    readonly label: string;
    readonly results: SelectionResult[] = [
        { id: 0, geometry: fromExtent([0, 0, 1, 1]) },
        { id: 1, geometry: fromExtent([1, 1, 2, 2]) }
    ];
    readonly calls: [SelectionKind, SelectionOptions][] = [];

    #status = reactive<SelectionSourceStatus>("available");

    constructor(label: string, status: SelectionSourceStatus = "available") {
        this.label = label;
        this.#status.value = status;
    }

    get status(): SelectionSourceStatus {
        return this.#status.value;
    }

    set status(status: SelectionSourceStatus) {
        this.#status.value = status;
    }

    async select(kind: SelectionKind, options: SelectionOptions): Promise<SelectionResult[]> {
        this.calls.push([kind, options]);
        return this.results;
    }
}

async function setup(options?: { sources?: SelectionSource[]; maxResults?: number }): Promise<{
    map: MapModel;
    viewModel: SelectionViewModel;
    onComplete: Mock;
    onError: Mock;
}> {
    const { map } = await setupMap({ advanced: { interactions: [], view: undefined } });
    const onComplete = vi.fn();
    const onError = vi.fn();
    const viewModel = new SelectionViewModel({
        map,
        messages: MESSAGES,
        maxResults: options?.maxResults,
        onComplete,
        onError
    });
    if (options?.sources) {
        viewModel.sources = options.sources;
    }
    return { map, viewModel, onComplete, onError };
}

/** Simulates the user drawing a box on the map. */
function selectExtent(map: MapModel, extent: Extent): void {
    const dragBox = findInteraction(map, DragBox);
    if (!dragBox) {
        throw new Error("No drag box interaction registered on the map.");
    }
    vi.spyOn(dragBox, "getGeometry").mockReturnValue(fromExtent(extent));
    dragBox.dispatchEvent("boxend");
}

function findInteraction<T extends Interaction>(
    map: MapModel,
    type: abstract new (...args: never[]) => T
): T | undefined {
    return map.olMap
        .getInteractions()
        .getArray()
        .find((interaction): interaction is T => interaction instanceof type);
}

/**
 * Returns the message currently displayed by the tooltip overlay.
 * The overlay's content is only rendered when the map is rendered, so we inspect the react node instead.
 */
function getTooltipMessage(map: MapModel): string | undefined {
    const content = findTooltip(map)?.content;
    if (!isValidElement<{ content?: string }>(content)) {
        return undefined;
    }
    return content.props.content;
}

function findTooltip(map: MapModel) {
    return map.overlays
        .getAll()
        .find((overlay) => overlay.element.className.includes("selection-tooltip"));
}
