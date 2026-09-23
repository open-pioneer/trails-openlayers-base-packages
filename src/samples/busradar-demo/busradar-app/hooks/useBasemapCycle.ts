// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { type MapModel } from "@open-pioneer/map";
import { useEffect, useState } from "react";
import { BASEMAP_DE_WEB_VECTOR_LAYER_ID, OPENSTREETMAP_LAYER_ID } from "../services";
import { isDefined } from "../utils/valueUtils";

const BASEMAP_CYCLE_LAYER_IDS = [OPENSTREETMAP_LAYER_ID, BASEMAP_DE_WEB_VECTOR_LAYER_ID];

type Basemap = ReturnType<MapModel["layers"]["getBaseLayers"]>[number];

/**
 * Kapselt den Hintergrundkarten-Cycle (nur Wechsel der aktiven Basemap, Center/Zoom/Rotation
 * bleiben erhalten). Hält die aktive Basemap-ID im State und stellt die nächste Basemap sowie
 * die Umschaltfunktion für den kompakten Basemap-Button bereit.
 */
export function useBasemapCycle(map: MapModel | undefined) {
    const [activeBaseLayerId, setActiveBaseLayerId] = useState<string | undefined>();

    useEffect(() => {
        setActiveBaseLayerId(map?.layers.getActiveBaseLayer()?.id);
    }, [map]);

    function getOrderedBasemaps(): Basemap[] {
        if (!map) {
            return [];
        }

        const configuredBasemaps = map.layers.getBaseLayers();
        return BASEMAP_CYCLE_LAYER_IDS.map((layerId) =>
            configuredBasemaps.find((layer) => layer.id === layerId)
        ).filter(isDefined);
    }

    function getNextBasemap(): Basemap | undefined {
        const orderedBasemaps = getOrderedBasemaps();
        if (!orderedBasemaps.length) {
            return undefined;
        }

        const currentLayerId = activeBaseLayerId ?? map?.layers.getActiveBaseLayer()?.id;
        const currentIndex = orderedBasemaps.findIndex((layer) => layer.id === currentLayerId);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % orderedBasemaps.length : 0;
        return orderedBasemaps[nextIndex];
    }

    function switchToNextBasemap() {
        const nextBasemap = getNextBasemap();
        if (!nextBasemap || !map?.layers.activateBaseLayer(nextBasemap.id)) {
            return;
        }

        setActiveBaseLayerId(nextBasemap.id);
    }

    return { nextBasemap: getNextBasemap(), switchToNextBasemap };
}
