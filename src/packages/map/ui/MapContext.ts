// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Provider, createContext, useContext } from "react";
import { type MapPadding } from "../api";
import type OlMap from "ol/Map";

/** Values provided to children of {@link MapContainer}. */
export interface MapContextType {
    map: OlMap;
    mapAnchorsHost: HTMLElement;
    padding: Required<MapPadding>;
}

const MapContext = createContext<MapContextType | undefined>(undefined);
MapContext.displayName = "MapContext";

export const MapContextProvider: Provider<MapContextType> =
    MapContext.Provider as Provider<MapContextType>;

export function useMapContext(): MapContextType {
    const contextValue = useContext(MapContext);
    if (!contextValue) {
        throw new Error(
            `Map context is not available. The component must be a child of the <MapContainer /> component.`
        );
    }
    return contextValue;
}
