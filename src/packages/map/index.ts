// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
export * from "./api";
export type { SimpleMapOptions } from "./test-utils";
export { waitForMapMount, setupMap, createPackageContextProviderProps } from "./test-utils";
export { useCenter, useFormatting, useProjection, useResolution, useScale } from "./hooks";
export { MapContainer, type MapContainerProps, type MapPadding } from "./MapContainer";
export { getProjection, registerProjections, type ProjectionDefinition } from "./projections";
export {
    useMapModel,
    type UseMapModelResult,
    type UseMapModelLoading,
    type UseMapModelResolved,
    type UseMapModelRejected
} from "./useMapModel";
