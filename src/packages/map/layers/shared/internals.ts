// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import { LayerConfig } from "./LayerConfig";
import { Layer } from "../unions";

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

export function assertInternalConstructor(tag: InternalConstructorTag) {
    if (tag !== INTERNAL_CONSTRUCTOR_TAG) {
        throw new Error("This constructor is internal.");
    }
}

// use symbols for internal functions
export const SET_VISIBLE = Symbol("SET_VISIBLE");
export const DETACH_FROM_MAP = Symbol("DETACH_FROM_MAP");
export const ATTACH_TO_MAP = Symbol("ATTACH_TO_MAP");
export const ATTACH_TO_GROUP = Symbol("ATTACH_TO_GROUP");
export const DETACH_FROM_GROUP = Symbol("DETACH_FROM_GROUP");
export const GET_RAW_LAYERS = Symbol("GET_RAW_LAYERS");
export const GET_PARENT = Symbol("GET_PARENT");
export const GET_DEPS = Symbol("GET_DEPS");
export const GET_RAW_SUBLAYERS = Symbol("GET_RAW_SUBLAYERS");
export const ATTACH_TO_PARENT = Symbol("ATTACH_TO_PARENT");
export const SET_LEGEND = Symbol("SET_LEGEND");
export const LAYER_DEPS = Symbol("LAYER_DEPS");
