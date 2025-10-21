// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/**
 * @module
 *
 * @groupDescription Services
 *
 * Services provided by this package and associated entities.
 *
 * @groupDescription Map Model
 *
 * Creating maps and accessing their state.
 *
 * @groupDescription UI Components and Hooks
 *
 * UI Components and hooks related to the map.
 *
 * @groupDescription Layers
 *
 * Layer classes and related types.
 *
 * @groupDescription Layer Utilities
 *
 * Utilities related to layer types.
 *
 * @groupDescription Utilities
 *
 * Various utilities related map state.
 */

// UI Components
export { MapAnchor, type MapAnchorPosition, type MapAnchorProps } from "./ui/MapAnchor";
export { MapContainer, type MapContainerProps } from "./ui/MapContainer";
export { DefaultMapProvider } from "./ui/DefaultMapProvider";

// Hooks
export {
    useMapModel,
    useMapModelValue,
    type MapModelProps,
    type UseMapModelLoading,
    type UseMapModelRejected,
    type UseMapModelResolved,
    type UseMapModelResult
} from "./ui/hooks/useMapModel";

// Layer types
export { type ChildrenCollection } from "./layers/shared/ChildrenCollection";
export { type SublayerBaseType } from "./layers/shared/SublayerBaseType";
export {
    type LayerBaseConfig,
    type HealthCheckFunction,
    type LayerConfig
} from "./layers/shared/LayerConfig";
export { type AbstractLayerBase as AnyLayerBaseType } from "./layers/AbstractLayerBase";
export { type LayerLoadState, type AbstractLayer as LayerBaseType } from "./layers/AbstractLayer";
export { isLayer, isSublayer, type AnyLayer, type Layer, type Sublayer } from "./layers/unions";
export { GroupLayer, type GroupLayerConfig } from "./layers/GroupLayer";
export { type GroupLayerCollection } from "./layers/group/GroupLayerCollection";
export { SimpleLayer, type SimpleLayerConfig } from "./layers/SimpleLayer";
export { type WMSSublayer, type WMSSublayerConfig } from "./layers/wms/WMSSublayer";
export { WMSLayer, type WMSLayerConfig } from "./layers/WMSLayer";
export { WMTSLayer, type WMTSLayerConfig } from "./layers/WMTSLayer";
export { type SublayersCollection } from "./layers/shared/SublayersCollection";
export {
    type AddLayerOptions,
    type AddLayerOptionsAboveBelow,
    type AddLayerOptionsBase,
    type AddLayerOptionsTopBottom
} from "./layers/shared/AddLayerOptions";
export {
    type LayerRetrievalOptions,
    type RecursiveRetrievalOptions
} from "./layers/shared/LayerRetrievalOptions";

// Map Model
export {
    type CoordinateConfig,
    type ExtentConfig,
    type InitialExtentConfig,
    type InitialPositionConfig,
    type InitialViewConfig,
    type MapConfig,
    type OlMapOptions
} from "./model/MapConfig";
export {
    type MapModel,
    type DisplayTarget,
    type Highlight,
    type HighlightOptions,
    type HighlightStyle,
    type HighlightZoomOptions,
    type MapPadding,
    type ZoomOptions
} from "./model/MapModel";
export { type LayerCollection } from "./model/LayerCollection";

// Services
export { type LayerFactory, type LayerCreateOptions } from "./LayerFactory";
export {
    type MapConfigProvider,
    type MapConfigProviderOptions,
    type MapRegistry
} from "./MapRegistry";

// Utils
export { calculateBufferedExtent } from "./utils/geometry-utils";
export { getProjection, registerProjections, type ProjectionDefinition } from "./utils/projections";
export { type BaseFeature } from "./utils/BaseFeature";
