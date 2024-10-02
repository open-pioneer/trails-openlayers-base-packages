// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Provider, createContext, useContext } from "react";

/** Values provided to children of {@link MapContainer}. */
export interface MapContainerContextType {
    mapAnchorsHost: HTMLElement;
}

const MapContainerContext = createContext<MapContainerContextType | undefined>(undefined);
MapContainerContext.displayName = "MapContainerContext";

export const MapContainerContextProvider: Provider<MapContainerContextType> =
    MapContainerContext.Provider as Provider<MapContainerContextType>;

export function useMapContainerContext(): MapContainerContextType {
    const contextValue = useContext(MapContainerContext);
    if (!contextValue) {
        throw new Error(
            `Map container context is not available. The component must be a child of the <MapContainer /> component.`
        );
    }
    return contextValue;
}
