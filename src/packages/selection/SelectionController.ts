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

const DEFAULT_MAX_RESULTS = 10000;

export class SelectionController {
    #mapModel: MapModel;

    /**
     * Limits the number of results.
     */
    #maxResults: number;

    /**
     * Called whenever an error happens.
     */
    #onError: () => void;

    constructor(options: { mapModel: MapModel; onError: () => void; maxResults?: number }) {
        const { mapModel, onError, maxResults = DEFAULT_MAX_RESULTS } = options;
        this.#mapModel = mapModel;
        this.#maxResults = maxResults;
        this.#onError = onError;
    }

    destroy() {}

    async select(
        source: SelectionSource,
        extent: Extent
    ): Promise<SelectionSourceResults | undefined> {
        if (!extent) {
            return undefined;
        }

        return await this.#selectFromSource(source, extent);
    }

    async #selectFromSource(
        source: SelectionSource,
        extent: Extent
    ): Promise<SelectionSourceResults | undefined> {
        const projection = this.#mapModel.olMap.getView().getProjection();
        try {
            LOG.debug(`Starting selection on source '${source.label}'`);

            const maxResults = this.#maxResults;
            let results = await source.select(
                { type: "extent", extent },
                {
                    maxResults,
                    mapProjection: projection,
                    signal: new AbortController().signal // currently not used
                }
            );
            if (results.length > maxResults) {
                results = results.slice(0, maxResults);
            }

            LOG.debug(`Found ${results.length} results on source '${source.label}'`);
            return { source: source, results: results };
        } catch (e) {
            LOG.error(`selection from source ${source.label} failed`, e);
            this.#onError();
            return undefined;
        }
    }
}
