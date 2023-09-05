// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { LayerCollection } from "@open-pioneer/map";
import { useEffect } from "react";

export function useBasemapLayers(
    layerId: string | undefined,
    layerCollection: LayerCollection | undefined
) {
    const baseLayers = layerCollection?.getBaseLayers();

    useEffect(() => {
        if (!baseLayers || !layerCollection || !layerId) {
            return;
        }

        const layer = baseLayers.find((layer) => layer.title === layerId);
        layerCollection.activateBaseLayer(layer ? layer.id : undefined);
    }, [baseLayers, layerCollection, layerId]);

    return { baseLayers };
}
