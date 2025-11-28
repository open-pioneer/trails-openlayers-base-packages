// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger, isAbortError, throwAbortError } from "@open-pioneer/core";
import { SearchSource, SearchResult } from "./api";
import { MapModel } from "@open-pioneer/map";

const LOG = createLogger("search:SearchController");

/**
 * Group of suggestions returned from one source.
 */
export interface SuggestionGroup {
    label: string;
    source: SearchSource;
    results: SearchResult[];
}

const DEFAULT_SEARCH_TYPING_DELAY = 200;
const DEFAULT_MAX_RESULTS_PER_SOURCE = 5;

export class SearchController {
    #mapModel: MapModel;

    /**
     * Search sources defined by the developer.
     */
    #sources: SearchSource[] = [];

    /**
     * Limits the number of results per source.
     */
    #maxResultsPerSource: number = DEFAULT_MAX_RESULTS_PER_SOURCE;

    /**
     * The timeout in millis.
     */
    #searchTypingDelay: number = DEFAULT_SEARCH_TYPING_DELAY;

    /**
     * Cancel or abort a previous request.
     */
    #abortController: AbortController | undefined;

    constructor(mapModel: MapModel, sources: SearchSource[]) {
        this.#mapModel = mapModel;
        this.#sources = sources;
    }

    destroy() {
        this.#abortController?.abort();
        this.#abortController = undefined;
    }

    async search(searchTerm: string): Promise<SuggestionGroup[]> {
        this.#abortController?.abort();
        this.#abortController = undefined;
        if (!searchTerm) {
            return [];
        }

        const abort = (this.#abortController = new AbortController());
        try {
            await waitForTimeOut(abort.signal, this.#searchTypingDelay);
            if (abort.signal.aborted) {
                LOG.debug(`search canceled with ${searchTerm}`);
                throwAbortError();
            }
            const settledSearches = await Promise.all(
                this.#sources.map((source) => this.#searchSource(source, searchTerm, abort.signal))
            );
            return settledSearches.filter((s): s is SuggestionGroup => s != null);
        } finally {
            if (this.#abortController === abort) {
                this.#abortController = undefined;
            }
        }
    }

    async #searchSource(
        source: SearchSource,
        searchTerm: string,
        signal: AbortSignal
    ): Promise<SuggestionGroup | undefined> {
        const label = source.label;
        const projection = this.#mapModel.projection;
        try {
            const maxResults = this.#maxResultsPerSource;
            let results = await source.search(searchTerm, {
                maxResults,
                signal,
                mapProjection: projection,
                map: this.#mapModel
            });
            if (results.length > maxResults) {
                results = results.slice(0, maxResults);
            }
            return { label, source, results };
        } catch (e) {
            if (!isAbortError(e)) {
                LOG.error(`search for source ${label} failed`, e);
            }
            return undefined;
        }
    }

    get searchTypingDelay(): number {
        return this.#searchTypingDelay;
    }

    set searchTypingDelay(value: number | undefined) {
        this.#searchTypingDelay = value ?? DEFAULT_SEARCH_TYPING_DELAY;
    }

    get maxResultsPerSource(): number {
        return this.#maxResultsPerSource;
    }

    set maxResultsPerSource(value: number | undefined) {
        this.#maxResultsPerSource = value ?? DEFAULT_MAX_RESULTS_PER_SOURCE;
    }

    get sources() {
        return this.#sources;
    }
}

/**
 * wait for timeouts millis or until signal is aborted, whatever happens first
 */
async function waitForTimeOut(signal: AbortSignal, timeoutMillis: number) {
    if (signal.aborted) {
        return;
    }

    await new Promise<void>((resolve) => {
        const done = () => {
            signal.removeEventListener("abort", done);
            clearTimeout(timeoutId);
            resolve();
        };

        signal.addEventListener("abort", done);
        const timeoutId = setTimeout(done, timeoutMillis);
    });
}
