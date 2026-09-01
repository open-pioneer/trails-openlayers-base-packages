// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { type MapModel } from "@open-pioneer/map";
import type BaseLayer from "ol/layer/Base";
import type VectorLayer from "ol/layer/Vector";
import type VectorSource from "ol/source/Vector";
import { SELECTED_TRANSIT_STOPS_LAYER_ID, TRANSIT_STOPS_LAYER_ID } from "./transitStopsLayer";

/** Löst den OpenLayers-Vektor-Layer der Haltestellen zur Map auf. */
export function getTransitStopsVectorLayer(map: MapModel | undefined) {
    const transitStopsLayer = map?.layers.getLayerById(TRANSIT_STOPS_LAYER_ID) as
        | { olLayer?: BaseLayer }
        | undefined;
    return transitStopsLayer?.olLayer as VectorLayer<VectorSource> | undefined;
}

/** Löst den OpenLayers-Vektor-Layer der ausgewählten Haltestelle zur Map auf. */
export function getSelectedTransitStopsVectorLayer(map: MapModel | undefined) {
    const selectedLayer = map?.layers.getLayerById(SELECTED_TRANSIT_STOPS_LAYER_ID) as
        | { olLayer?: BaseLayer }
        | undefined;
    return selectedLayer?.olLayer as VectorLayer<VectorSource> | undefined;
}
