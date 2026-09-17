// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { nextTick } from "@conterra/reactivity-core";
import { throwAbortError } from "@open-pioneer/core";
import { MapModel } from "@open-pioneer/map";
import { Projection } from "ol/proj";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchOptions, SearchResult, SearchSource } from "../api";
import { SearchOperationState } from "./SearchOperationState";
import { SearchViewModel } from "./SearchViewModel";

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers(); // some tests use fake timers
});

it("defines default values and falls back to them", async () => {
    const { viewModel } = await setup({ searchTypingDelay: null, maxResultsPerSource: null });
    expect(viewModel.searchTypingDelay).toBe(200);
    expect(viewModel.maxResultsPerSource).toBe(5);

    viewModel.searchTypingDelay = 25;
    viewModel.maxResultsPerSource = 1;
    expect(viewModel.searchTypingDelay).toBe(25);
    expect(viewModel.maxResultsPerSource).toBe(1);

    // Resetting a value restores the default.
    viewModel.searchTypingDelay = undefined;
    viewModel.maxResultsPerSource = undefined;
    expect(viewModel.searchTypingDelay).toBe(200);
    expect(viewModel.maxResultsPerSource).toBe(5);
});

describe("searching", () => {
    it("starts out empty", async () => {
        const source = new TestSource("Cities");
        const { viewModel } = await setup({ sources: [source] });
        await settle();

        expect(viewModel.inputValue).toBe("");
        expect(viewModel.selectedResult).toBeUndefined();
        expect(viewModel.pending).toBe(false);
        expect(viewModel.currentSearchState.query).toBe("");
        expect(viewModel.currentSearchState.sourceResults).toEqual([]);
        expect(source.calls).toEqual([]);
    });

    it("searches all sources when the input value changes", async () => {
        const cities = new TestSource("Cities");
        const rivers = new TestSource("Rivers");
        const { viewModel } = await setup({ sources: [cities, rivers] });

        viewModel.setInputValue("Dort");
        expect(viewModel.inputValue).toBe("Dort");

        const state = await waitForResults(viewModel, "Dort");
        expect(state.sourceResults).toEqual([
            { source: cities, results: cities.results },
            { source: rivers, results: rivers.results }
        ]);
        expect(cities.queries()).toEqual(["Dort"]);
        expect(rivers.queries()).toEqual(["Dort"]);
    });

    it("searches for the trimmed input value", async () => {
        const source = new TestSource("Cities");
        const { viewModel } = await setup({ sources: [source] });

        viewModel.setInputValue("  Dort  ");
        await waitForResults(viewModel, "Dort");

        expect(source.queries()).toEqual(["Dort"]);
        expect(viewModel.inputValue).toBe("  Dort  "); // the user's input is not modified
    });

    it("passes the search options to the sources", async () => {
        const source = new TestSource("Cities");
        const { map, viewModel } = await setup({ sources: [source], maxResultsPerSource: 3 });

        viewModel.setInputValue("Dort");
        await waitForResults(viewModel, "Dort");

        const options = source.options(0);
        expect(options.maxResults).toBe(3);
        expect(options.map).toBe(map);
        expect(options.mapProjection).toBe(map.projection);
        expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it("truncates results that exceed maxResultsPerSource", async () => {
        const source = new TestSource("Cities", [
            { id: 0, label: "a" },
            { id: 1, label: "b" },
            { id: 2, label: "c" }
        ]);
        const { viewModel } = await setup({ sources: [source], maxResultsPerSource: 2 });

        viewModel.setInputValue("x");
        const state = await waitForResults(viewModel, "x");

        expect(state.sourceResults[0]!.results).toEqual([
            { id: 0, label: "a" },
            { id: 1, label: "b" }
        ]);
    });

    it("clears the results when the input value becomes blank", async () => {
        const source = new TestSource("Cities");
        const { viewModel } = await setup({ sources: [source] });
        viewModel.setInputValue("Dort");
        await waitForResults(viewModel, "Dort");

        viewModel.setInputValue("   ");
        await settle();

        expect(source.calls).toHaveLength(1); // blank queries are not searched for
        expect(viewModel.pending).toBe(false);
        expect(viewModel.currentSearchState.query).toBe("");
        expect(viewModel.currentSearchState.sourceResults).toEqual([]);
    });

    it("waits for the typing delay before querying the sources", async () => {
        // NOTE: Fake timers only affect the typing delay. Reactive updates are dispatched via
        // message channel, so nextTick() still works as usual.
        vi.useFakeTimers();

        const typingDelay = 300;
        const source = new TestSource("Cities");
        const { viewModel } = await setup({ sources: [source], searchTypingDelay: typingDelay });

        viewModel.setInputValue("Dor");
        await nextTick();
        expect(viewModel.pending).toBe(true); // the spinner shows while the user is typing

        // The source is not queried before the delay has elapsed.
        await vi.advanceTimersByTimeAsync(typingDelay - 1);
        expect(source.calls).toEqual([]);

        // The user keeps typing within the delay, so the first query never reaches the source.
        viewModel.setInputValue("Dort");
        await nextTick();
        await vi.advanceTimersByTimeAsync(typingDelay);

        expect(source.queries()).toEqual(["Dort"]);
        expect(viewModel.pending).toBe(false);
        expect(viewModel.currentSearchState.sourceResults).toEqual([
            { source, results: source.results }
        ]);
    });

    it("is pending while a search is running", async () => {
        const source = new BlockingTestSource("Cities");
        const { viewModel } = await setup({ sources: [source] });

        viewModel.setInputValue("Dort");
        await vi.waitFor(() => expect(source.calls).toHaveLength(1));
        expect(viewModel.pending).toBe(true);

        await source.completeSearch(0);
        await vi.waitFor(() => expect(viewModel.pending).toBe(false));
    });

    it("cancels the previous search when the input value changes again", async () => {
        const source = new BlockingTestSource("Cities");
        const { viewModel } = await setup({ sources: [source] });

        viewModel.setInputValue("Dort");
        await vi.waitFor(() => expect(source.calls).toHaveLength(1));

        viewModel.setInputValue("Müns");
        await vi.waitFor(() => expect(source.calls).toHaveLength(2));

        expect(source.options(0).signal.aborted).toBe(true);
        expect(source.options(1).signal.aborted).toBe(false);

        // Results of the outdated search are ignored.
        await source.completeSearch(0);
        expect(viewModel.currentSearchState.query).toBe("Müns");
        expect(viewModel.pending).toBe(true);

        const results = [{ id: 4, label: "Münster" }];
        await source.completeSearch(1, results);
        const state = await waitForResults(viewModel, "Müns");
        expect(state.sourceResults).toEqual([{ source, results }]);
    });

    it("logs the error and returns no results if a source fails", async () => {
        const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
        const broken = new TestSource("Broken");
        broken.search = async () => {
            throw new Error("boom");
        };
        const working = new TestSource("Cities");
        const { viewModel } = await setup({ sources: [broken, working] });

        viewModel.setInputValue("Dort");
        const state = await waitForResults(viewModel, "Dort");
        expect(state.sourceResults).toEqual([
            { source: broken, results: [] },
            { source: working, results: working.results }
        ]);
        expect(logSpy).toHaveBeenCalledOnce();
        expect(logSpy.mock.lastCall![0]).toMatchInlineSnapshot(
            `"[ERROR] @open-pioneer/search/model/SearchOperationState: search on source 'Broken' failed"`
        );
    });

    it("does not log abort errors from sources", async () => {
        const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
        const source = new TestSource("Cities");
        source.search = async () => throwAbortError();
        const { viewModel } = await setup({ sources: [source] });

        viewModel.setInputValue("Dort");
        await waitForResults(viewModel, "Dort");

        expect(viewModel.currentSearchState.sourceResults).toEqual([{ source, results: [] }]);
        expect(logSpy).not.toHaveBeenCalled();
    });

    it("searches the new sources once the search term changes", async () => {
        const cities = new TestSource("Cities");
        const rivers = new TestSource("Rivers");
        const { viewModel } = await setup({ sources: [cities] });
        viewModel.setInputValue("Dort");
        await waitForResults(viewModel, "Dort");

        viewModel.sources = [cities, rivers];
        viewModel.setInputValue("Dortm");
        const state = await waitForResults(viewModel, "Dortm");

        expect(rivers.queries()).toEqual(["Dortm"]);
        expect(state.sourceResults).toEqual([
            { source: cities, results: cities.results },
            { source: rivers, results: rivers.results }
        ]);
    });
});

describe("selection", () => {
    it("shows the result's label and emits the select event", async () => {
        const source = new TestSource("Cities");
        const { viewModel, onSelect } = await setup({ sources: [source] });
        viewModel.setInputValue("Dort");
        await waitForResults(viewModel, "Dort");

        const result = source.results[0]!;
        expect(result).toBeDefined();
        viewModel.selectResult(source, result, "user");

        expect(viewModel.inputValue).toBe(result.label);
        expect(viewModel.selectedResult).toEqual({ source, result });
        expect(onSelect).toHaveBeenCalledWith({ source, result, trigger: "user" });
    });

    it("does not start a new search when a result is selected", async () => {
        const source = new TestSource("Cities");
        const { viewModel } = await setup({ sources: [source] });
        viewModel.setInputValue("Dort");
        const state = await waitForResults(viewModel, "Dort");
        expect(source.calls).toHaveLength(1);

        viewModel.selectResult(source, source.results[0]!, "user");
        await settle();

        expect(source.calls).toHaveLength(1);
        expect(viewModel.currentSearchState).toBe(state); // the results stay visible
        expect(viewModel.pending).toBe(false);
    });

    it("clears the selection when the input value changes", async () => {
        const source = new TestSource("Cities");
        const { viewModel } = await setup({ sources: [source] });
        viewModel.setInputValue("Dort");
        await waitForResults(viewModel, "Dort");
        viewModel.selectResult(source, source.results[0]!, "user");
        expect(viewModel.selectedResult).toBeDefined();

        viewModel.setInputValue("Müns");
        expect(viewModel.selectedResult).toBeUndefined();
    });
});

describe("clear", () => {
    it("resets input, selection and results", async () => {
        const source = new TestSource("Cities");
        const { viewModel, onClear } = await setup({ sources: [source] });
        viewModel.setInputValue("Dort");
        await waitForResults(viewModel, "Dort");
        viewModel.selectResult(source, source.results[0]!, "user");

        viewModel.clear("user");

        expect(viewModel.inputValue).toBe("");
        expect(viewModel.selectedResult).toBeUndefined();
        expect(onClear).toHaveBeenCalledWith({ trigger: "user" });

        await waitForResults(viewModel, "");
        expect(viewModel.currentSearchState.sourceResults).toEqual([]);
    });

    it("forwards the trigger of the clear event", async () => {
        const { viewModel, onClear } = await setup();
        viewModel.clear("api-reset");
        expect(onClear).toHaveBeenCalledWith({ trigger: "api-reset" });
    });

    it("cancels a pending search", async () => {
        const source = new BlockingTestSource("Cities");
        const { viewModel } = await setup({ sources: [source] });
        viewModel.setInputValue("Dort");
        await vi.waitFor(() => expect(source.calls).toHaveLength(1));

        viewModel.clear("user");

        await vi.waitFor(() => expect(source.options(0).signal.aborted).toBe(true));
        await vi.waitFor(() => expect(viewModel.pending).toBe(false));
    });
});

describe("searchAndSelect", () => {
    it("selects the first result across all sources", async () => {
        const empty = new TestSource("Empty", []);
        const cities = new TestSource("Cities");
        const { viewModel, onSelect } = await setup({ sources: [empty, cities] });

        const selection = await viewModel.searchAndSelect("Dort");

        const result = cities.results[0]!;
        expect(selection).toEqual({ source: cities, result });
        expect(viewModel.inputValue).toBe(result.label);
        expect(viewModel.selectedResult).toEqual({ source: cities, result });
        expect(onSelect).toHaveBeenCalledWith({ source: cities, result, trigger: "api-select" });

        // The results of this search are shown in the UI.
        expect(viewModel.currentSearchState.query).toBe("Dort");
        expect(viewModel.currentSearchState.sourceResults).toEqual([
            { source: empty, results: [] },
            { source: cities, results: cities.results }
        ]);

        // The input field does not search for this query again.
        await settle();
        expect(empty.calls).toHaveLength(1);
        expect(cities.calls).toHaveLength(1);
    });

    it("returns undefined for a blank query without searching", async () => {
        const source = new TestSource("Cities");
        const { viewModel, onSelect } = await setup({ sources: [source] });

        await expect(viewModel.searchAndSelect("   ")).resolves.toBeUndefined();

        expect(source.calls).toEqual([]);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it("returns undefined and keeps the state if nothing matches", async () => {
        const source = new TestSource("Cities", []);
        const { viewModel, onSelect } = await setup({ sources: [source] });
        await settle();

        const selection = await viewModel.searchAndSelect("Dort");
        expect(selection).toBeUndefined();
        expect(viewModel.inputValue).toBe("");
        expect(viewModel.selectedResult).toBeUndefined();
        expect(onSelect).not.toHaveBeenCalled();
    });

    it("is cancelled when the input field starts another search", async () => {
        const source = new BlockingTestSource("Cities");
        const { viewModel, onSelect } = await setup({ sources: [source] });
        const selection = viewModel.searchAndSelect("Dort");
        await vi.waitFor(() => expect(source.calls).toHaveLength(1));

        viewModel.setInputValue("Müns");
        await vi.waitFor(() => expect(source.calls).toHaveLength(2));
        expect(source.options(0).signal.aborted).toBe(true);

        await source.completeSearch(0);
        await expect(selection).resolves.toBeUndefined();
        expect(onSelect).not.toHaveBeenCalled();
    });
});

describe("destroy", () => {
    it("cancels the pending search", async () => {
        const source = new BlockingTestSource("Cities");
        const { viewModel } = await setup({ sources: [source] });
        viewModel.setInputValue("Dort");
        await vi.waitFor(() => expect(source.calls).toHaveLength(1));

        viewModel.destroy();

        expect(source.options(0).signal.aborted).toBe(true);
    });

    it("cancels a pending searchAndSelect", async () => {
        const source = new BlockingTestSource("Cities");
        const { viewModel, onSelect } = await setup({ sources: [source] });
        const promise = viewModel.searchAndSelect("Dort");
        await vi.waitFor(() => expect(source.calls).toHaveLength(1));

        viewModel.destroy();
        expect(source.options(0).signal.aborted).toBe(true);

        await source.completeSearch(0);
        await expect(promise).resolves.toBeUndefined();
        expect(onSelect).not.toHaveBeenCalled();
    });

    it("stops searching once it has been destroyed", async () => {
        const source = new TestSource("Cities");
        const { viewModel } = await setup({ sources: [source] });
        viewModel.destroy();

        viewModel.setInputValue("Dort");
        await settle();

        expect(source.calls).toEqual([]);
    });
});

/** A search source that returns its results immediately. */
class TestSource implements SearchSource {
    readonly label: string;
    readonly results: SearchResult[];
    readonly calls: [string, SearchOptions][] = [];

    constructor(label: string, results?: SearchResult[]) {
        this.label = label;
        this.results = results ?? [
            { id: 0, label: `${label} 0` },
            { id: 1, label: `${label} 1` }
        ];
    }

    async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
        this.calls.push([query, options]);
        return this.results;
    }

    /** The options that were passed to the n-th `search()` call. */
    options(callIndex: number): SearchOptions {
        const call = this.calls[callIndex];
        if (!call) {
            throw new Error(`There is no search() call with index ${callIndex}.`);
        }
        return call[1];
    }

    /** Returns the queries that were used on this source. */
    queries(): string[] {
        return this.calls.map(([query]) => query);
    }
}

/**
 * A search source that keeps its `search()` calls pending until the test completes them.
 */
class BlockingTestSource extends TestSource {
    /** Resolve functions of the pending `search()` calls, in call order. */
    readonly #pending: ((results: SearchResult[]) => void)[] = [];

    override async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
        const callIndex = this.calls.push([query, options]) - 1;
        return await new Promise<SearchResult[]>((resolve) => {
            this.#pending[callIndex] = resolve;
        });
    }

    /** Completes the n-th `search()` call and waits for the view model to react. */
    async completeSearch(callIndex: number, results = this.results): Promise<void> {
        const resolve = this.#pending[callIndex];
        if (!resolve) {
            throw new Error(`There is no pending search() call with index ${callIndex}.`);
        }
        delete this.#pending[callIndex];
        resolve(results);
        await nextTick();
    }
}

async function setup(options?: {
    sources?: SearchSource[];
    // null for "keep default"
    maxResultsPerSource?: number | null;
    searchTypingDelay?: number | null;
}) {
    const map = createMapMock();
    const onSelect = vi.fn();
    const onClear = vi.fn();
    const viewModel = new SearchViewModel({ map, onSelect, onClear });
    if (options?.searchTypingDelay !== null) {
        viewModel.searchTypingDelay = options?.searchTypingDelay ?? 0;
    }
    if (options?.maxResultsPerSource !== null) {
        viewModel.maxResultsPerSource = options?.maxResultsPerSource;
    }
    if (options?.sources) {
        viewModel.sources = options.sources;
    }
    return { map, viewModel, onSelect, onClear };
}

function createMapMock(): MapModel {
    return {
        projection: new Projection({ code: "EPSG:4326" })
    } satisfies Partial<MapModel> as unknown as MapModel;
}

/** Waits until the search for `query` has finished and returns its state. */
async function waitForResults(
    viewModel: SearchViewModel,
    query: string
): Promise<SearchOperationState> {
    await vi.waitFor(() => {
        expect(viewModel.currentSearchState.query).toBe(query);
        expect(viewModel.pending).toBe(false);
    });
    return viewModel.currentSearchState;
}

/** Some timeout to ensure that nothing happens after a change. */
async function settle(): Promise<void> {
    await nextTick();
    await wait(5);
    await nextTick();
}

async function wait(millis: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, millis));
}
