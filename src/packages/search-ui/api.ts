// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Geometry } from "ol/geom";

/**
 * Common interface for integration of different search sources.
 * Developers can create classes that implement this interface for different search sources.
 */
export interface DataSource {
    /**
     * The label of the data source.
     *
     * This will be displayed by the user interface when results from this data source are shown.
     */
    readonly label: string;

    /**
     * Performs a search and return a list of suggestions.
     *
     * Implementations should return the suggestions ordered by priority (best match first), if possible.
     *
     * The provided `AbortSignal` in `options.signal` is used to cancel outdated requests.
     */
    search(inputValue: string, options: { signal: AbortSignal }): Promise<Suggestion[]>;
}

/**
 * Represent a suggestion.
 */
export interface Suggestion {
    /**
     * Identifier for the suggested result object.
     * Values used here should be unique within the context of the data source that returns them.
     */
    id: number | string;

    /**
     * Display text for the suggestion list.
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
