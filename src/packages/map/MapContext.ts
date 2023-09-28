// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Provider, createContext, useContext } from "react";
import { type MapPadding } from "./MapContainer";
import type OlMap from "ol/Map";

/** Values provided to children of {@link MapContainer}. */
export interface MapContextType {
    map: OlMap;
    mapAnchorsHost: HTMLDivElement;
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
