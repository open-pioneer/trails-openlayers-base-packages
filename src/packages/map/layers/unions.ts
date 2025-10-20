// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { type GroupLayer } from "./GroupLayer";
import { type SimpleLayer } from "./SimpleLayer";
import { type WMSSublayer } from "./wms/WMSSublayer";
import { type WMSLayer } from "./WMSLayer";
import { type WMTSLayer } from "./WMTSLayer";

// Imports for typedoc
// eslint-disable-next-line unused-imports/no-unused-imports
import { type SublayerBaseType } from "./shared/SublayerBaseType";
// eslint-disable-next-line unused-imports/no-unused-imports
import { type LayerBaseType } from "..";

/**
 * Supported layer type identifiers.
 *
 * NOTE: More layer types may be added in future versions.
 */
export type LayerTypes = "simple" | "wms" | "wmts" | "group";

/**
 * Supported sublayer type identifiers.
 *
 * NOTE: More sublayer types may be added in future versions.
 */
export type SublayerTypes = "wms-sublayer";

/**
 * Supported layer type identifiers for both operational layers and sublayers.
 */
export type AnyLayerTypes = LayerTypes | SublayerTypes;

/**
 * Union type for all layers (extending {@link LayerBaseType}).
 *
 * NOTE: More layer implementations may be added in future versions.
 */
export type Layer = SimpleLayer | WMSLayer | WMTSLayer | GroupLayer;

/**
 * Union type for all sublayers (extending {@link SublayerBaseType}.
 *
 * NOTE: More sublayer implementations may be added in future versions.
 */
export type Sublayer = WMSSublayer;

/**
 * Union for all types of layers
 */
export type AnyLayer = Layer | Sublayer;

/**
 * Type guard for checking if the layer is a {@link Sublayer}.
 */
export function isSublayer(layer: AnyLayer): layer is Sublayer {
    return "parentLayer" in layer;
}

/**
 * Type guard for checking if the layer is a {@link Layer} (and not a {@link Sublayer}).
 */
export function isLayer(layer: AnyLayer): layer is Layer {
    return "olLayer" in layer;
}
