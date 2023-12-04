// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import type { SelectionSource, SelectionResult } from "./api";
import { MapModel } from "@open-pioneer/map";
import { Extent } from "ol/extent";

const LOG = createLogger("selection:SelectionController");

/**
 * All results returned from one source.
 */
export interface SelectionSourceResults {
    source: SelectionSource;
    results: SelectionResult[];
}

// TODO: Reconsider default value
const DEFAULT_MAX_RESULTS_PER_SOURCE = 1000;

export class SelectionController {
    #mapModel: MapModel;

    /**
     * Select from sources defined by the developer.
     */
    #sources: SelectionSource[] = [];

    /**
     * Limits the number of results per source.
     */
    #maxResultsPerSource: number = DEFAULT_MAX_RESULTS_PER_SOURCE;

    constructor(mapModel: MapModel, sources: SelectionSource[]) {
        this.#mapModel = mapModel;
        this.#sources = sources;
    }

    async select(extent: Extent): Promise<SelectionSourceResults[]> {
        if (!extent) {
            return [];
        }
        const settledSelections = await Promise.all(
            this.#sources.map((source) => this.#selectFromSource(source, extent))
        );
        return settledSelections.filter((s): s is SelectionSourceResults => s != null);
    }

    async #selectFromSource(
        source: SelectionSource,
        extent: Extent
    ): Promise<SelectionSourceResults | undefined> {
        const projection = this.#mapModel.olMap.getView().getProjection();
        try {
            const maxResults = this.#maxResultsPerSource;
            let results = await source.select(extent, {
                maxResults,
                mapProjection: projection
            });
            if (results.length > maxResults) {
                results = results.slice(0, maxResults);
            }
            return { source, results };
        } catch (e) {
            LOG.error(`selection from source ${source.label} failed`, e);
            return undefined;
        }
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
