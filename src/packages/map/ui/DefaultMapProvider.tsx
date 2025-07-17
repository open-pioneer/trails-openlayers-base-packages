// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createContext, ReactNode, useContext, useMemo } from "react";
import { MapModelProps } from "./useMapModel";

const DefaultMapContext = createContext<MapModelProps | undefined>(undefined);
DefaultMapContext.displayName = "DefaultMapContext";

/**
 * Configures the given map as the default map for all child components.
 * Child components do not need to specify the map explicitly, unless they wish to use a different one.
 *
 * @example
 *
 * Using map model reference:
 *
 * ```tsx
 * <DefaultMapProvider map={myMapModel}>
 *   <MapContainer />
 *   <Toc />
 * </DefaultMapProvider>
 * ```
 */
export function DefaultMapProvider(
    props: MapModelProps & { children?: React.ReactNode }
): ReactNode {
    const { mapId, map, children } = props;
    const value = useMemo((): MapModelProps => ({ mapId, map }), [mapId, map]);
    if (mapId != null && map != null) {
        throw new Error(
            `Cannot specify both 'mapId' and 'map' in DefaultMapProvider at the same time.`
        );
    }
    if (mapId == null && map == null) {
        throw new Error(`Either 'mapId' or 'map' must be specified in DefaultMapProvider.`);
    }
    return <DefaultMapContext.Provider value={value}>{children}</DefaultMapContext.Provider>;
}

/**
 * Accesses the default map props provided by {@link DefaultMapProvider} (or returns undefined).
 *
 * @internal
 */
export function useDefaultMapProps(): MapModelProps | undefined {
    return useContext(DefaultMapContext);
}
