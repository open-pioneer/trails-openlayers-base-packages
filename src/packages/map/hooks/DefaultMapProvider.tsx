// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createContext, useContext } from "react";
import { MapModel } from "../api";
import { MapModelProps } from "./useMapModel";

const DefaultMapContext = createContext<MapModel | undefined>(undefined);
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
    props: Required<MapModelProps> & { children?: React.ReactNode }
) {
    const { map, children } = props;
    if (map == null) {
        throw new Error(`DefaultMapProvider requires the 'map' property.`);
    }
    return <DefaultMapContext.Provider value={map}>{children}</DefaultMapContext.Provider>;
}

/**
 * Accesses the default map props provided by {@link DefaultMapProvider} (or returns undefined).
 *
 * @internal
 */
export function useDefaultMap(): MapModel | undefined {
    return useContext(DefaultMapContext);
}
