// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
export type * from "./api";
export { SimpleLayerModel, WMSLayerModel } from "./layerTypes";
export { getProjection, registerProjections, type ProjectionDefinition } from "./projections";
export { BkgTopPlusOpen, type BkgTopPlusOpenProps } from "./layers/BkgTopPlusOpen";

// UI Components and React helpers
export { useCenter, useProjection, useResolution, useScale } from "./ui/hooks";
export { MapAnchor, type MapAnchorProps, type MapAnchorPosition } from "./ui/MapAnchor";
export { MapContainer, type MapContainerProps, type MapPadding } from "./ui/MapContainer";
export {
    useMapModel,
    type UseMapModelResult,
    type UseMapModelLoading,
    type UseMapModelResolved,
    type UseMapModelRejected
} from "./ui/useMapModel";
