// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Layer } from "../unions";

/**
 * Configuration options supported by all layer types (layers and sublayers).
 */
export interface LayerBaseConfig {
    /**
     * The unique id of this layer.
     * Defaults to a generated id.
     */
    id?: string;

    /**
     * The human-readable title of this layer.
     */
    title: string;

    /**
     * The human-readable description of this layer.
     * Defaults to an empty string.
     */
    description?: string;

    /**
     * Whether this layer should initially be visible.
     * Defaults to `true`.
     */
    visible?: boolean;

    /**
     * Additional attributes for this layer.
     * These can be arbitrary values.
     */
    attributes?: Record<string | symbol, unknown>;

    /**
     * Layers marked as internal are not considered by any UI widget (e.g. Toc or Legend).
     * By default, layers are not included when retrieving all layers of a collection (see {@link LayerRetrievalOptions.includeInternalLayers}).
     *
     * Defaults to `false`
     */
    internal?: boolean;
}

/**
 * Configuration options supported by all operational layer types.
 */
export interface LayerConfig extends LayerBaseConfig {
    /**
     * Whether this layer is a base layer or not.
     * Only one base layer can be active at a time.
     *
     * Defaults to `false`.
     */
    isBaseLayer?: boolean;

    /**
     * Optional property to check the availability of the layer.
     * It is possible to provide either a URL which indicates the state of the service (2xx response meaning "ok")
     * or a {@link HealthCheckFunction} performing a custom check and returning the state.
     */
    healthCheck?: string | HealthCheckFunction;
}

/** Custom function to check the state of a layer and returning a "loaded" or "error". */
export type HealthCheckFunction = (layer: Layer) => Promise<"loaded" | "error">;
