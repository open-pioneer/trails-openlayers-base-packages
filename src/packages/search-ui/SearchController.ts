// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger, throwAbortError } from "@open-pioneer/core";
import { DataSource, Suggestion, SuggestionGroup } from "./api";

const LOG = createLogger("search-ui.SearchController");

interface ControllerConfig {
    searchTypingDelay: number;
    sources: DataSource[];
}

export class SearchController {
    #sources: DataSource[] = [];
    #searchTypingDelay: number = 250;
    abortController: AbortController | undefined;

    constructor(options: ControllerConfig) {
        this.#sources = options.sources;
        this.#searchTypingDelay = options.searchTypingDelay;
    }

    async search(searchTerm: string): Promise<SuggestionGroup[]> {
        this.abortController?.abort("canceled");
        const abort = (this.abortController = new AbortController());
        try {
            await waitForTimeOut(abort.signal, this.searchTypingDelay);
            if (abort.signal.aborted) {
                LOG.debug(`search canceled with ${searchTerm}`);
                throwAbortError();
            }
            // const runningQueries = await Promise.allSettled(
            //     this.#sources.map((source) => source.search(searchTerm, { signal: abort.signal }))
            // );
            const results = [];
            for (const source of this.sources) {
                try {
                    const result = await source.search(searchTerm, { signal: abort.signal });
                    results.push({ label: source.label, suggestions: result });
                } catch (error) {
                    LOG.error(`search for source ${source.label} fail with ${error}`);
                }
            }
            // const results = runningQuerie
            //     .map((query, index) => {
            //         return { ...query, label: this.sources[index]?.label };
            //     })
            //     .filter(
            //         (
            //             result
            //         ): result is { label: string; status: "fulfilled"; value: Suggestion[] } => {
            //             result.status === "rejected" &&
            //                 LOG.error(
            //                     `search for source ${result.label} fail with ${result.reason}`
            //                 );
            //             return result?.status === "fulfilled";
            //         }
            //     )
            //     .map((result) => ({
            //         label: result.label,
            //         suggestions: result.value
            //     }));
            console.log(results);
            return results;
        } finally {
            if (this.abortController === abort) {
                this.abortController = undefined;
            }
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
