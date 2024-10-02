// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
export * from "./BaseFeature";
export * from "./MapConfig";
export * from "./MapModel";
export * from "./MapRegistry";
export * from "./layers";
export * from "./shared";

export { getProjection, registerProjections, type ProjectionDefinition } from "../projections";
export { BkgTopPlusOpen, type BkgTopPlusOpenProps } from "../layers/BkgTopPlusOpen";

// UI Components and React helpers
export { useView, useProjection, useResolution, useCenter, useScale } from "../ui/hooks";
export { MapAnchor, type MapAnchorProps, type MapAnchorPosition } from "../ui/MapAnchor";
export { MapContainer, type MapContainerProps } from "../ui/MapContainer";
export {
    useMapModel,
    type UseMapModelResult,
    type UseMapModelLoading,
    type UseMapModelResolved,
    type UseMapModelRejected,
    type MapModelProps
} from "../ui/useMapModel";
export { DefaultMapProvider } from "../ui/DefaultMapProvider";

export { calculateBufferedExtent } from "../util/geometry-utils";

export { TOPMOST_LAYER_Z } from "../model/LayerCollectionImpl";
