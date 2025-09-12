// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

// UI Components
export { MapAnchor, type MapAnchorPosition, type MapAnchorProps } from "./ui/MapAnchor";
export { MapContainer, type MapContainerProps } from "./ui/MapContainer";

// Hooks
export { DefaultMapProvider } from "./hooks/DefaultMapProvider";
export {
    useMapModel,
    useMapModelValue,
    type MapModelProps,
    type UseMapModelLoading,
    type UseMapModelRejected,
    type UseMapModelResolved,
    type UseMapModelResult
} from "./hooks/useMapModel";

// Layer types
export {
    isLayer,
    isSublayer,
    type AnyLayer,
    type AnyLayerBaseType,
    type ChildrenCollection,
    type HealthCheckFunction,
    type Layer,
    type LayerBaseConfig,
    type LayerBaseEvents,
    type LayerBaseType,
    type LayerConfig,
    type LayerLoadState,
    type Sublayer,
    type SublayerBaseType,
    type SublayersCollection
} from "./layers/base";
export { GroupLayer, type GroupLayerCollection, type GroupLayerConfig } from "./layers/GroupLayer";
export { SimpleLayer, type SimpleLayerConfig } from "./layers/SimpleLayer";
export {
    WMSLayer,
    type WMSLayerConfig,
    type WMSSublayer,
    type WMSSublayerConfig
} from "./layers/WMSLayer";
export { WMTSLayer, type WMTSLayerConfig } from "./layers/WMTSLayer";

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
    type DisplayTarget,
    type Highlight,
    type HighlightOptions,
    type HighlightStyle,
    type HighlightZoomOptions,
    type LayerCollection,
    type MapModel,
    type MapModelEvents,
    type MapPadding,
    type ZoomOptions
} from "./model/MapModel";

// FIXME: remove this
export { TOPMOST_LAYER_Z } from "./model/LayerCollectionImpl";

// Services
export { LayerFactory } from "./LayerFactory";
export {
    type MapConfigProvider,
    type MapConfigProviderOptions,
    type MapRegistry
} from "./MapRegistry";

// Utils
export { calculateBufferedExtent } from "./utils/geometry-utils";
export { getProjection, registerProjections, type ProjectionDefinition } from "./utils/projections";

// TODO: Decide where to put this
export { type BaseFeature } from "./BaseFeature";

// TODO: Decide where to put this
export {
    type AddLayerOptions,
    type AddLayerOptionsAboveBelow,
    type AddLayerOptionsBase,
    type AddLayerOptionsTopBottom,
    type LayerRetrievalOptions,
    type RecursiveRetrievalOptions
} from "./shared";
