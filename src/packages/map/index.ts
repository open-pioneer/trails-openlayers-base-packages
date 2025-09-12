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
    type AnyLayerBaseType,
    type ChildrenCollection,
    type LayerBaseEvents,
    type LayerBaseType,
    type SublayerBaseType
} from "./layers/shared/base";
export {
    type LayerBaseConfig,
    type HealthCheckFunction,
    type LayerConfig
} from "./layers/shared/config";
export { type LayerLoadState } from "./layers/AbstractLayer";
export { isLayer, isSublayer, type AnyLayer, type Layer, type Sublayer } from "./layers/unions";
export { GroupLayer, type GroupLayerConfig } from "./layers/GroupLayer";
export { type GroupLayerCollection } from "./layers/group/GroupLayerCollection";
export { SimpleLayer, type SimpleLayerConfig } from "./layers/SimpleLayer";
export { type WMSSublayer, type WMSSublayerConfig } from "./layers/wms/WMSSublayer";
export { WMSLayer, type WMSLayerConfig } from "./layers/WMSLayer";
export { WMTSLayer, type WMTSLayerConfig } from "./layers/WMTSLayer";
export { type SublayersCollection } from "./layers/shared/SublayersCollection";

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
