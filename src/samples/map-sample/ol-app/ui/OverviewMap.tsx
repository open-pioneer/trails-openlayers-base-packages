// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { OverviewMap } from "@open-pioneer/overview-map";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { useMemo } from "react";
import { MAP_ID } from "../MapConfigProviderImpl"; // TODO

export function OverviewMapComponent() {
    // Layer is created in useMemo: don't recreate it on each render.
    const overviewMapLayer = useMemo(
        () =>
            new TileLayer({
                source: new OSM()
            }),
        []
    );

    return (
        <Box
            backgroundColor="white"
            borderWidth="1px"
            borderRadius="lg"
            padding={2}
            boxShadow="lg"
            maxWidth={325}
        >
            <Box role="dialog">
                <OverviewMap mapId={MAP_ID} olLayer={overviewMapLayer} />
            </Box>
        </Box>
    );
}
