// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Geometry } from "ol/geom";
import { Projection } from "ol/proj";

/**
 * An object that allows searching some set of data.
 *
 * Developers can create classes that implement this interface for different search sources.
 */
export interface SearchSource {
    /**
     * The label of this source.
     *
     * This will be displayed by the user interface when results from this search source are shown.
     */
    readonly label: string;

    /**
     * Performs a search and return a list of search results.
     *
     * Implementations should return the results ordered by priority (best match first), if possible.
     *
     * The provided `AbortSignal` in `options.signal` is used to cancel outdated requests.
     *
     * NOTE: If your search source implements custom error handling (i.e. `try`/`catch`), it is good practice to forward
     * abort errors without modification. This will enable the Search widget to hide "errors" due to
     * cancellation.
     *
     * For example:
     *
     * ```js
     * import { isAbortError } from "@open-pioneer/core";
     *
     * class CustomSearchSource {
     *     async search(input, { signal }) {
     *         try {
     *             // If the search is cancelled by the UI, doRequest
     *             // will throw an AbortError. It might throw other errors
     *             // due to application errors, network problems etc.
     *             const result = await doCustomSearch(input, signal);
     *             // ... do something with result
     *         } catch (e) {
     *             if (isAbortError(e)) {
     *                 throw e; // rethrow original error
     *             }
     *             // Possibly use custom error codes or error classes for better error messages
     *             throw new Error("Custom search failed", { cause: e });
     *         }
     *     }
     * }
     * ```
     */
    search(inputValue: string, options: SearchOptions): Promise<SearchResult[]>;
}

/** Options passed to a {@link SearchSource} when triggering a search. */
export interface SearchOptions {
    /**
     * The maximum number of search results requested by the search widget.
     * The widget will not display additional results, should the source provide them.
     *
     * This property allows the source to fetch no more results than necessary.
     */
    maxResults: number;

    /**
     * The signal can be used to detect cancellation.
     * The search widget will automatically cancel obsolete requests
     * when new search operations are started.
     *
     * You can pass this signal to builtin functions like `fetch` that automatically
     * support cancellation.
     */
    signal: AbortSignal;

    /**
     * The current projection of the map.
     * Useful to return the search result's geometry in the suitable projection.
     */
    mapProjection: Projection;
}

/**
 * Represent the result of a search.
 */
export interface SearchResult {
    /**
     * Identifier for the result object.
     * Values used here should be unique within the context of the search source that returns them.
     *
     * If your source cannot provide a useful id on its own, another strategy to generate unique ids is to
     * generate a [UUID](https://www.npmjs.com/package/uuid#uuidv4options-buffer-offset) instead.
     */
    id: number | string;

    /**
     * Display text representing this result.
     * Will be shown in the search widget's suggestion list.
     */
    label: string;

    /**
     * Optional geometry.
     *
     * If a geometry is provided, one should also specify the {@link projection}.
     *
     * If no projection has been specified, calling code should assume the map's projection.
     */
    geometry?: Geometry;

    /**
     * The projection of the {@link geometry}.
     */
    projection?: string;

    /**
     * Arbitrary additional properties.
     */
    properties?: Readonly<Record<string, unknown>>;
}
