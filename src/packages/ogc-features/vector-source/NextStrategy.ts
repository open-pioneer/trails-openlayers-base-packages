// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import Feature from "ol/Feature";
import FeatureFormat from "ol/format/Feature";
import { queryFeatures } from "./requestUtils";

interface NextStrategyOptions {
    fullUrl: URL;
    limit: number;
    featureFormat: FeatureFormat;
    httpService: HttpService;
    signal: AbortSignal;

    // Called for partial results as they appear
    onFeaturesLoaded: (features: Feature[]) => void;
}

/**
 * Loads features from the OGC API Features collection by following the "next" links.
 *
 * This is the standards compliant way of iterating through a result set.
 *
 * This implementation may be slow for large data sets because it does not allow for any parallelism.
 */
export class NextStrategy {
    constructor(private options: NextStrategyOptions) {}

    async load(): Promise<Feature[]> {
        const options = this.options;
        const limit = options.limit;

        let url = new URL(options.fullUrl);
        url.searchParams.set("limit", limit.toString());

        const featureChunks: Feature[][] = [];
        do {
            const { features, nextLink } = await queryFeatures(
                url,
                options.featureFormat,
                options.httpService,
                options.signal
            );

            options.onFeaturesLoaded(features);
            featureChunks.push(features);

            if (!nextLink) {
                break;
            }
            url = new URL(nextLink);
            // eslint-disable-next-line no-constant-condition
        } while (1);
        return featureChunks.flat(1);
    }
}
