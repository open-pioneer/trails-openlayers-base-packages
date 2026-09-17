// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { batch, CleanupHandle, reactive, watch } from "@conterra/reactivity-core";
import { createLogger, destroyResource, isAbortError, shallowEqual } from "@open-pioneer/core";
import { MapModel } from "@open-pioneer/map";
import { sourceId } from "open-pioneer:source-info";
import {
    SearchClearEvent,
    SearchClearTrigger,
    SearchResult,
    SearchSelectEvent,
    SearchSelectTrigger,
    SearchSource,
    SelectResult
} from "../api";
import {
    EMPTY_STATE,
    SearchOperationState,
    SearchOperationStateImpl,
    SearchSourceResults
} from "./SearchOperationState";

const LOG = createLogger(sourceId);

const DEFAULT_MAX_RESULTS_PER_SOURCE = 5;
const DEFAULT_SEARCH_TYPING_DELAY = 200;

/**
 * Options to construct a {@link SearchViewModel}.
 */
export interface SearchViewModelOptions {
    /** The map the search is associated with. It is passed on to the search sources. */
    map: MapModel;

    /** Called whenever a result has been selected (by the user or via the search API). */
    onSelect: (event: SearchSelectEvent) => void;

    /** Called whenever the search has been cleared (by the user or via the search API). */
    onClear: (event: SearchClearEvent) => void;
}

/**
 * The view model holds the state for the search component.
 *
 * A new search operation is started automatically whenever the search term changes.
 */
export class SearchViewModel {
    #map: MapModel;
    #onSelect: (event: SearchSelectEvent) => void;
    #onClear: (event: SearchClearEvent) => void;

    #maxResultsPerSource = reactive(DEFAULT_MAX_RESULTS_PER_SOURCE);
    #searchTypingDelay = reactive(DEFAULT_SEARCH_TYPING_DELAY);
    #sources = reactive<SearchSource[]>([], { equal: shallowEqual });

    /** The text currently shown in the input field. */
    #inputValue = reactive("");

    /**
     * The term that searches are being run for.
     *
     * Not necessarily the same as {@link #inputValue}.
     * Selecting a result changes the _input value_, but not this search term
     * to avoid starting an additional search.
     */
    #searchTerm = reactive("");

    /** The result selected by the user or via the search API. */
    #selected = reactive<SelectResult>();

    /** The state of the current search operation. */
    #currentState = reactive<SearchOperationState>(EMPTY_STATE);

    /**
     * The currently running search operation.
     * Only one search can be running at a time; new search operations cancel old ones.
     */
    #currentOperation: SearchOperationStateImpl | undefined;

    #searchWatch: CleanupHandle | undefined;

    constructor(options: SearchViewModelOptions) {
        this.#map = options.map;
        this.#onSelect = options.onSelect;
        this.#onClear = options.onClear;

        // Runs a new search whenever the search term changes.
        this.#searchWatch = watch(
            () => [this.#searchTerm.value.trim()],
            ([query]) => {
                this.#currentState.value = this.#startSearchOperation(query);
            }
        );
    }

    destroy(): void {
        this.#searchWatch = destroyResource(this.#searchWatch);
        this.#currentOperation = destroyResource(this.#currentOperation);
    }

    get sources(): SearchSource[] {
        return this.#sources.value;
    }

    set sources(newSources: SearchSource[]) {
        this.#sources.value = newSources;
    }

    /**
     * Debounce delay (in milliseconds) that controls how long the view model waits
     * before starting a new search after the search term changed.
     */
    get searchTypingDelay(): number {
        return this.#searchTypingDelay.value;
    }

    set searchTypingDelay(value: number | undefined) {
        this.#searchTypingDelay.value = value ?? DEFAULT_SEARCH_TYPING_DELAY;
    }

    /**
     * Maximum number of results per search source.
     */
    get maxResultsPerSource(): number {
        return this.#maxResultsPerSource.value;
    }

    set maxResultsPerSource(value: number | undefined) {
        this.#maxResultsPerSource.value = value ?? DEFAULT_MAX_RESULTS_PER_SOURCE;
    }

    /**
     * The text shown in the search control's input field.
     *
     * Use {@link setInputValue} to change it.
     */
    get inputValue(): string {
        return this.#inputValue.value;
    }

    /**
     * The result currently selected by the user, if any.
     */
    get selectedResult(): SelectResult | undefined {
        return this.#selected.value;
    }

    /**
     * True while a search is being delayed or executed.
     */
    get pending(): boolean {
        return this.currentSearchState.pending;
    }

    /**
     * The state of the current search operation.
     *
     * The reactive properties of this object update as the search progresses.
     */
    get currentSearchState(): SearchOperationState {
        return this.#currentState.value;
    }

    /**
     * Replaces the text in the input field and searches for it.
     */
    setInputValue(value: string): void {
        batch(() => {
            this.#inputValue.value = value;
            this.#searchTerm.value = value;
            this.#selected.value = undefined;
        });
    }

    /**
     * Confirms the given result: the input field shows the result's label and the result
     * becomes the current selection.
     */
    selectResult(source: SearchSource, result: SearchResult, trigger: SearchSelectTrigger): void {
        batch(() => {
            this.#inputValue.value = result.label;
            this.#selected.value = { source, result };
        });
        this.#onSelect({ source, result, trigger });
    }

    /**
     * Clears the input field, the current selection and the current search.
     */
    clear(trigger: SearchClearTrigger): void {
        batch(() => {
            this.#inputValue.value = "";
            this.#searchTerm.value = "";
            this.#selected.value = undefined;
        });
        this.#onClear({ trigger });
    }

    /**
     * Searches for the given query and selects the first matching result.
     *
     * Returns the selected result, or `undefined` if the search did not return anything.
     */
    async searchAndSelect(query: string): Promise<SelectResult | undefined> {
        // NOTE: The search term is left untouched, so this search does not change the input
        // field's state (and the input field does not search for this query again).
        const operation = this.#startSearchOperation(query.trim());
        try {
            await operation.completed;
        } catch {
            // Cancelled (another search was started) or failed; already reported by
            // #startSearchOperation.
            return undefined;
        }

        const selection = firstResult(operation.sourceResults);
        if (!selection) {
            return undefined;
        }

        batch(() => {
            this.#currentState.value = operation; // show the results of this search
            this.#inputValue.value = selection.result.label;
            this.#selected.value = selection;
        });
        this.#onSelect({ ...selection, trigger: "api-select" });
        return selection;
    }

    /**
     * Starts a new search operation, cancelling the one that may still be running.
     *
     * The current configuration is captured here, when the operation starts: it must not be
     * re-read from the operation's async continuations.
     *
     * Errors are reported here, so callers never have to handle them (and cannot cause an
     * unhandled rejection by ignoring the operation's promise).
     */
    #startSearchOperation(query: string): SearchOperationStateImpl {
        this.#currentOperation?.destroy();

        const operation = (this.#currentOperation = new SearchOperationStateImpl({
            query,
            sources: this.sources,
            maxResults: this.maxResultsPerSource,
            map: this.#map,
            typingDelay: this.searchTypingDelay
        }));
        operation.completed.catch((e) => {
            if (!isAbortError(e)) {
                LOG.error(`search operation for query '${query}' failed`, e);
            }
        });
        return operation;
    }
}

/**
 * Returns the first result across all sources (in source order).
 */
function firstResult(sourceResults: readonly SearchSourceResults[]): SelectResult | undefined {
    for (const { source, results } of sourceResults) {
        const result = results[0];
        if (result) {
            return { source, result };
        }
    }
    return undefined;
}
