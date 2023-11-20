// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger, isAbortError, throwAbortError } from "@open-pioneer/core";
import { DataSource, Suggestion } from "./api";

const LOG = createLogger("search-ui.SearchController");

interface ControllerConfig {
    searchTypingDelay: number;
    sources: DataSource[];
}

/**
 * Group of suggestions returned from one source.
 */
export interface SuggestionGroup {
    label: string;
    suggestions: Suggestion[];
}

export class SearchController {
    /**
     * Search sources defined by the developer.
     */
    #sources: DataSource[] = [];

    /**
     * The timeout in millis.
     */
    #searchTypingDelay: number;

    /**
     * Cancel or abort a previous request.
     */
    #abortController: AbortController | undefined;

    constructor(options: ControllerConfig) {
        this.#sources = options.sources;
        this.#searchTypingDelay = options.searchTypingDelay;
    }

    destroy() {
        this.#abortController?.abort("canceled");
        this.#abortController = undefined;
    }

    async search(searchTerm: string): Promise<SuggestionGroup[]> {
        this.#abortController?.abort("canceled");
        const abort = (this.#abortController = new AbortController());
        try {
            await waitForTimeOut(abort.signal, this.searchTypingDelay);
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
        source: DataSource,
        searchTerm: string,
        signal: AbortSignal
    ): Promise<SuggestionGroup | undefined> {
        const label = source.label;
        try {
            const result = await source.search(searchTerm, { signal });
            return { label: label, suggestions: result };
        } catch (e) {
            if (!isAbortError(e)) {
                LOG.error(`search for source ${label} failed`, e);
            }
            return undefined;
        }
    }

    get searchTypingDelay() {
        return this.#searchTypingDelay;
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
