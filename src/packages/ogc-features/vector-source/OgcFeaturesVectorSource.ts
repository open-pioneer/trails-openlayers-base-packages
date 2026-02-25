// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger, isAbortError, throwAbortError } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import { Extent } from "ol/extent";
import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import { bbox } from "ol/loadingstrategy";
import { Projection } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { sourceId } from "open-pioneer:source-info";
import { OgcFeatureVectorSourceOptions } from "../api";
import { CollectionMetadata, getCollectionMetadata, getRequestCrs } from "./Metadata";
import { NextStrategy } from "./NextStrategy";
import { OffsetStrategy, supportsOffsetStrategy } from "./OffsetStrategy";
import { createCollectionRequestUrl } from "./requestUtils";

const LOG = createLogger(sourceId);

const DEFAULT_LIMIT = 5000;

type SuccessCallback = (features: Feature[]) => void;
type FailureCallback = () => void;

export class OgcFeaturesVectorSource extends VectorSource {
    #featureFormat: GeoJSON;
    #httpService: HttpService;

    #options: OgcFeatureVectorSourceOptions;
    #itemsUrl: string;

    #metadataPromise: Promise<CollectionMetadata> | undefined;
    #loadingStrategyPromise: Promise<"offset" | "next"> | undefined;

    // Cancels pending feature load operations.
    #featuresAbortController: AbortController | undefined;

    // Maps a map CRS to the corresponding request CRS that should be used for requests to the OGC API Features service.
    #mapCrsToRequestCrs: Record<string, string> = {};

    constructor(options: OgcFeatureVectorSourceOptions, httpService: HttpService) {
        const format = new GeoJSON();
        super({
            format,
            strategy: bbox,
            attributions: options.attributions,
            loader: (...args) => {
                this.#load(...args);
            },
            ...options.additionalOptions
        });
        this.#featureFormat = format;
        this.#httpService = httpService;
        this.#options = options;
        this.#itemsUrl = `${options.baseUrl}/collections/${options.collectionId}/items`;
    }

    async #load(
        extent: Extent,
        _resolution: number,
        projection: Projection,
        success: SuccessCallback | undefined,
        failure: FailureCallback | undefined
    ) {
        try {
            const features = await this.#loadImpl(extent, projection);
            success?.(features);
            this.changed(); // Always trigger changed event to unstuck loading state
        } catch (e) {
            if (!isAbortError(e)) {
                LOG.error("Failed to load features from ogc service", e);
            }
            failure?.();

            // Always trigger changed event to unstuck loading state
            // See https://github.com/openlayers/openlayers/issues/17335
            this.changed();
        }
    }

    async #loadImpl(extent: Extent, projection: Projection): Promise<Feature[]> {
        const [collectionMetadata, strategy] = await Promise.all([
            this.#loadCollectionMetadata(),
            this.#getLoadingStrategy()
        ]);

        // An extent-change should cancel open requests for older extents, because otherwise,
        // old and expensive requests could block new requests for a new extent
        // => no features are drawn on the current map for a long time.
        this.#featuresAbortController?.abort("Extent changed");
        const abortController = (this.#featuresAbortController = new AbortController());
        try {
            const requestCrs = this.#getRequestCrs(collectionMetadata, projection);
            const fullUrl = this.#getRequestUrl(extent, requestCrs);
            const sharedOptions = {
                fullUrl,
                featureFormat: this.#featureFormat,
                limit: this.#options.limit ?? DEFAULT_LIMIT,
                httpService: this.#httpService,
                signal: abortController.signal,
                onFeaturesLoaded: (features: Feature[]) => {
                    LOG.debug(`Adding ${features.length} features`);
                    this.addFeatures(features);
                }
            };
            let strategyImpl;
            switch (strategy) {
                case "next": {
                    strategyImpl = new NextStrategy(sharedOptions);
                    break;
                }
                case "offset":
                    strategyImpl = new OffsetStrategy({
                        ...sharedOptions,
                        concurrency: this.#options.maxConcurrentRequests
                    });
                    break;
            }

            const features = await strategyImpl.load();
            LOG.debug("Finished loading features for extent:", extent);
            return features;
        } catch (e) {
            if (isAbortError(e)) {
                this.removeLoadedExtent(extent);
            }
            throw e;
        }
    }

    // Fetches collection metadata from the service (once).
    async #loadCollectionMetadata() {
        const run = async () => {
            let metadata;
            try {
                metadata = await getCollectionMetadata(
                    this.#options.baseUrl,
                    this.#options.collectionId,
                    this.#httpService
                );
            } catch (e) {
                LOG.error("Failed to retrieve collection metadata", e);
                throwAbortError(); // Report error up the stack but only log error once
            }

            try {
                if (this.getAttributions() == null && metadata.attribution) {
                    this.setAttributions(metadata.attribution);
                }
            } catch (e) {
                LOG.error("Failed to apply attributions", e);
                throwAbortError(); // Report error up the stack but only log error once
            }
            return metadata;
        };

        const promise = (this.#metadataPromise ??= run());
        return await promise;
    }

    // Runs feature detection on the service (once).
    async #getLoadingStrategy() {
        const run = async () => {
            let supportsOffset;
            try {
                supportsOffset = await supportsOffsetStrategy(this.#itemsUrl, this.#httpService);
            } catch (e) {
                LOG.error("Failed to retrieve collection information", e);
                throwAbortError(); // Report error up the stack but only log error once
            }

            const options = this.#options;
            let strategy = options?.strategy || (supportsOffset ? "offset" : "next");
            if (strategy === "offset" && !supportsOffset) {
                strategy = "next";
            }
            return strategy;
        };

        const promise = (this.#loadingStrategyPromise ??= run());
        return await promise;
    }

    // Computes the appropriate request crs for the current configuration.
    #getRequestCrs(collectionMetadata: CollectionMetadata | undefined, projection: Projection) {
        const mapCrs = projection.getCode();
        const requestCrs = (this.#mapCrsToRequestCrs[mapCrs] ??= getRequestCrs(
            mapCrs,
            collectionMetadata?.crs,
            this.#options.crs
        ));
        return requestCrs;
    }

    #getRequestUrl(extent: Extent, requestCrs: string) {
        let requestUrl = createCollectionRequestUrl(this.#itemsUrl, extent, requestCrs);
        const rewriteUrl = this.#options.rewriteUrl;
        if (rewriteUrl) {
            requestUrl = rewriteUrl(requestUrl) ?? requestUrl;
        }
        return requestUrl;
    }
}
