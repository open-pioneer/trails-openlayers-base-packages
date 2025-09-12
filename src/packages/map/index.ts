// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

// UI Components
export { MapAnchor, type MapAnchorProps, type MapAnchorPosition } from "./ui/MapAnchor";
export { MapContainer, type MapContainerProps } from "./ui/MapContainer";

// Hooks
export {
    useMapModel,
    useMapModelValue,
    type UseMapModelResult,
    type UseMapModelLoading,
    type UseMapModelResolved,
    type UseMapModelRejected,
    type MapModelProps
} from "./hooks/useMapModel";
export { DefaultMapProvider } from "./hooks/DefaultMapProvider";

// Layer types
// TODO: export * from "./layers";

// Map Model
// TODO:
// export * from "./model/MapConfig";
// export * from "./model/MapModel";

// Services
export {
    // TODO: Rename impl class
    MapRegistryImpl as MapRegistry
} from "./MapRegistryImpl";
export { LayerFactory } from "./LayerFactory";

// Utils
export { getProjection, registerProjections, type ProjectionDefinition } from "./utils/projections";
export { calculateBufferedExtent } from "./utils/geometry-utils";

// TODO: Decide where to put this
export { type BaseFeature } from "./BaseFeature";

// TODO: ???
// export * from "./shared";
