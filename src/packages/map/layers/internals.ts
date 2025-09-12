// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import { Layer, LayerConfig } from "../../api";

/**
 * Package-internal constructor tag to signal that the layer constructor is being called from the layer factory.
 *
 * @internal
 */
export const INTERNAL_CONSTRUCTOR_TAG = Symbol("INTERNAL_CONSTRUCTOR_TAG");
export type InternalConstructorTag = typeof INTERNAL_CONSTRUCTOR_TAG;

/**
 * Options passed from the layer factory to the layer constructor.
 *
 * @internal
 */
export interface LayerDependencies {
    httpService: HttpService;
}

/**
 * Interface implemented by layer classes (the prototype, not the instance).
 *
 * - `Config`: the options supported or required as construction parameters.
 * - `LayerType`: the type of the resulting layer instance.
 *
 * @internal
 */
export interface LayerConstructor<Config extends LayerConfig, LayerType extends Layer> {
    prototype: LayerType;
    new (config: Config, deps: LayerDependencies, tag: InternalConstructorTag): LayerType;
}

/**
 * Helper function to verify that the correct tag was used.
 *
 * Returns the layer dependencies passed by the layer factory or returns undefined.
 *
 * Throws an error if an invalid tag was provided.
 */
export function getLayerDependencies(
    deps: LayerDependencies | undefined,
    tag: InternalConstructorTag | undefined
): LayerDependencies | undefined {
    if (tag == null) {
        // no tag -> used old constructor overload
        return undefined;
    }
    if (tag !== INTERNAL_CONSTRUCTOR_TAG) {
        throw new Error(
            "Attempt to call an internal layer constructor. Use the LayerFactory service instead."
        );
    }
    if (!deps) {
        // If the correct tag was used, then the dependencies must have been passed by the factory
        throw new Error("Internal error: layer dependencies are missing");
    }
    return deps;
}
