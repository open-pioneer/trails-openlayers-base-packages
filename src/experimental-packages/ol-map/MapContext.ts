// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { createContext } from "react";
import { type MapPadding } from "./MapContainer";
import type OlMap from "ol/Map";

/** Values provided to children of {@link MapContainer}. */
export interface MapContextValue {
    map: OlMap;
    padding: Required<MapPadding>;
}

export const MapContext = createContext<MapContextValue | undefined>(undefined);
MapContext.displayName = "MapContext";
