// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Geometry } from "ol/geom";
/**
 * Common interface for integration of different search sources.
 * Developers can create classes that implement this interface for different search sources.
 */
export interface DataSource {
    /**
     * The label of the source group.
     */
    readonly label: string;

    /**
     * Perform a search and return a list of suggestions.
     */
    search(inputValue: string, options?: { signal?: AbortSignal }): Promise<Suggestion[]>;
}
/**
 * Represent a suggestion.
 */
export interface Suggestion {
    /**
     * Identifier for the suggested result object.
     */
    id: number | string;

    /**
     * TODO
     */
    value: string;

    /**
     * Display text for the suggestion list.
     */
    label: string;

    /**
     * Optional geometry (including srs).
     */
    geometry?: Geometry;

    /**
     * Arbitrary additional properties.
     */
    properties?: Readonly<Record<string, unknown>>;
}
/**
 * Group of suggestions returned from one source.
 */
export interface SuggestionGroup {
    label: string;
    suggestions: Suggestion[];
}
