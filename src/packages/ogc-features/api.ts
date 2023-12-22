// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { DeclaredService } from "@open-pioneer/runtime";
import { SearchSource } from "@open-pioneer/search";
import Feature from "ol/Feature";
import { Geometry } from "ol/geom";
import { AttributionLike } from "ol/source/Source";
import VectorSource, { Options } from "ol/source/Vector";

/**
 * These are properties for OGC API Features vector source.
 */
export interface OgcFeatureVectorSourceOptions {
    /** The base-URL right to the "/collections"-part */
    baseUrl: string;

    /** The collection-ID */
    collectionId: string;

    /** the URL to the EPSG-Code, e.g. http://www.opengis.net/def/crs/EPSG/0/25832 */
    crs: string;

    /**
     * The maximum number of features to fetch within a single request.
     * Corresponds to the `limit` parameter in the URL.
     *
     * When the `offset` strategy is used for feature fetching, the limit
     * is used for the page size
     *
     * Defaults to `5000` for Next-Strategy.
     * Defaults to `2500` for Offset-Strategy.
     */
    limit?: number;

    /** The maximum number of concurrent requests. Defaults to `6`. */
    maxConcurrentRequests?: number;

    /** Optional attribution for the layer (e.g. copyright hints). */
    attributions?: AttributionLike | undefined;

    /** Optional additional options for the VectorSource. */
    additionalOptions?: Options<Feature<Geometry>>;
}

/**
 * A factory that creates {@link VectorSource | vector sources} for an OGC API Features service.
 * The resulting vector sources can be used in an OpenLayers `VectorLayer`.
 *
 * Use the interface name `"ogc-features.VectorSourceFactory"` to obtain an instance of this factory.
 */
export interface OgcFeaturesVectorSourceFactory
    extends DeclaredService<"ogc-features.VectorSourceFactory"> {
    /**
     * Creates a new {@link VectorSource} that loads features from the specified feature service.
     */
    createVectorSource(options: OgcFeatureVectorSourceOptions): VectorSource;
}

/** Options for {@link OgcFeatureSearchSource}. */
export interface OgcFeatureSearchSourceOptions {
    /** The source's label. May be used as a title for results from this source. */
    label: string;

    /**
     * The URL to the service, not including the "/collections"-part.
     *
     * Query arguments here are also used for individual requests by default, for example:
     *
     * ```js
     * new OgcFeatureSearchSource({
     *    // token is also used for all requests made by this class
     *    baseUrl: `https://example.com/ogc-service?token=...`
     * })
     * ```
     */
    baseUrl: string;

    /**
     * The ID of the collection.
     */
    collectionId: string;

    /**
     * Property used for filtering on OGC API Features.
     */
    searchProperty: string;

    /**
     * Property used for labelling.
     *
     * Defaults to `searchProperty`.
     *
     * This property can be useful if searchProperty is not returned by the service, or
     * if another field shall be displayed instead.
     */
    labelProperty?: string;

    /**
     * Function to create custom a label for a given feature.
     *
     * If the label is not customized by this function, `labelProperty` (or `searchProperty`) will be used instead.
     */
    renderLabel?: (feature: FeatureResponse) => string | undefined;

    /**
     * Rewrite function to modify the original URL.
     *
     * NOTE: Do not update the `url` argument. Return a new `URL` instance instead.
     */
    rewriteUrl?: (url: URL) => URL | undefined;
}

/** The general shape of features returned by an OGC API Features service. */
export interface FeatureResponse {
    /**
     * The type of the feature (e.g. `Feature`).
     */
    type: string;

    /**
     * The id of the feature.
     */
    id: string | number;

    /**
     * The geometry of the feature.
     */
    geometry: unknown;

    /**
     * The properties of the feature.
     */
    properties: Readonly<Record<string, unknown>>;
}

/**
 * A factory that creates {@link SearchSource | search sources} for an OGC API Features service.
 * The resulting search sources can be used in combination with the `@open-pioneer/search` package.
 *
 * Use the interface name `"ogc-features.SearchSourceFactory"` to obtain an instance of this factory.
 */
export interface OgcFeaturesSearchSourceFactory
    extends DeclaredService<"ogc-features.SearchSourceFactory"> {
    /**
     * Returns a new {@link SearchSource} that searches on the specified feature service.
     */
    createSearchSource(options: OgcFeatureSearchSourceOptions): SearchSource;
}
