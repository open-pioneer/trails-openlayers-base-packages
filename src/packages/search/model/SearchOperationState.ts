// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { batch, reactive } from "@conterra/reactivity-core";
import { createAbortError, createLogger, isAbortError } from "@open-pioneer/core";
import { MapModel } from "@open-pioneer/map";
import { sourceId } from "open-pioneer:source-info";
import { SearchResult, SearchSource } from "../api";

const LOG = createLogger(sourceId);

/**
 * The state of a single search operation, with one entry per search source.
 */
export interface SearchOperationState {
    // NOTE: `error` state is not modelled here; it might not be needed.
    // Failed searches simply return no results for the time being.

    /** The query string used for this search operation. */
    readonly query: string;

    /** True while the search is being delayed or executed. */
    readonly pending: boolean;

    /** Results per search source. Empty while {@link pending}. */
    readonly sourceResults: readonly SearchSourceResults[];
}

/**
 * Search results of a single search source.
 */
export interface SearchSourceResults {
    /** The source that returned the {@link results}. */
    readonly source: SearchSource;

    /** The results returned by the source. */
    readonly results: readonly SearchResult[];
}

/** The state before anything has been searched for. */
export const EMPTY_STATE: SearchOperationState = {
    query: "",
    pending: false,
    sourceResults: []
};

export interface SearchOperationOptions {
    query: string;
    sources: readonly SearchSource[];
    maxResults: number;
    map: MapModel;
    typingDelay: number;
}

/**
 * A single search operation: wait for the typing delay, then query all sources in parallel.
 *
 * The operation can be cancelled by calling {@link destroy}.
 */
export class SearchOperationStateImpl implements SearchOperationState {
    #options: SearchOperationOptions;

    readonly query: string;

    /** Resolves when the results are available; rejects if the operation was cancelled. */
    readonly completed: Promise<void>;

    #pending = reactive(true);
    #sourceResults = reactive<readonly SearchSourceResults[]>([]);
    #abortController = new AbortController();

    constructor(options: SearchOperationOptions) {
        this.#options = options;
        this.query = options.query;
        if (!options.query) {
            this.#pending.value = false;
            this.completed = Promise.resolve();
        } else {
            this.completed = this.#run();
        }
    }

    /**
     * Cancels this operation.
     *
     * The operation also stops being {@link pending}: it will never deliver any results, so
     * anything that still shows this state must not keep waiting for them.
     */
    destroy(): void {
        this.#abortController.abort();
        this.#pending.value = false;
    }

    get pending(): boolean {
        return this.#pending.value;
    }

    get sourceResults(): readonly SearchSourceResults[] {
        return this.#sourceResults.value;
    }

    async #run(): Promise<void> {
        const { query, sources, maxResults, map, typingDelay } = this.#options;
        const signal = this.#abortController.signal;
        LOG.debug(`starting search operation for query '${query}'`);

        // The user might still be typing: if the search term changes, we get cancelled here.
        await waitForTimeout(typingDelay, signal);

        // Search all sources in parallel. searchInSource() does not throw.
        const sourceResults = await Promise.all(
            sources.map(async (source) => ({
                source,
                results: await this.#searchInSource(source, { query, maxResults, map }, signal)
            }))
        );
        signal.throwIfAborted();

        batch(() => {
            this.#sourceResults.value = sourceResults;
            this.#pending.value = false;
        });
        LOG.debug(`search operation for query '${query}' finished`, sourceResults);
    }

    async #searchInSource(
        source: SearchSource,
        options: Pick<SearchOperationOptions, "query" | "maxResults" | "map">,
        signal: AbortSignal
    ): Promise<SearchResult[]> {
        const { query, maxResults, map } = options;
        try {
            LOG.debug(`starting search on source '${source.label}'`);

            let results = await source.search(query, {
                maxResults,
                signal,
                map,
                mapProjection: map.projection // for backwards compat
            });
            signal.throwIfAborted();

            if (results.length > maxResults) {
                results = results.slice(0, maxResults);
            }

            LOG.debug(`finished search on source '${source.label}'`, results);
            return results;
        } catch (e) {
            if (!isAbortError(e)) {
                LOG.error(`search on source '${source.label}' failed`, e);
            }
            return [];
        }
    }
}

/**
 * Waits for timeoutMillis or until signal is aborted, whatever happens first.
 */
async function waitForTimeout(timeoutMillis: number, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();

    await new Promise<void>((resolve, reject) => {
        const onAbort = () => {
            clearTimeout(timeoutId);
            reject(createAbortError());
        };
        const timeoutId = setTimeout(() => {
            // NOTE: If the signal had been aborted, onAbort() would have cleared this timeout.
            signal.removeEventListener("abort", onAbort);
            resolve();
        }, timeoutMillis);
        signal.addEventListener("abort", onAbort, { once: true });
    });
}
