// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMapModel } from "@open-pioneer/map";
import { useService } from "open-pioneer:react-hooks";
import { AppModel } from "../AppModel";
import { MAP_ID } from "../map/MapConfigProviderImpl";
import { CoordinateSearch } from "@open-pioneer/coordinate-search";
import { Coordinate } from "ol/coordinate";
import { Point } from "ol/geom";
import { Box, Flex } from "@open-pioneer/chakra-integration";

export function CoordinateSearchComponent() {
    const { map } = useMapModel(MAP_ID);
    const appModel = useService<AppModel>("ol-app.AppModel");

    function onCoordinateSearch(coords: Coordinate) {
        if (!map) {
            return;
        }
        const geometry = new Point(coords);
        if (!geometry) {
            return;
        }

        appModel.highlightAndZoom(map, [geometry]);
    }

    function onSearchCleared() {
        appModel.clearHighlight();
    }

    return (
        <Box padding={"5px"}>
            <CoordinateSearch
                mapId={MAP_ID}
                onSelect={({ coords }) => onCoordinateSearch(coords)}
                onClear={onSearchCleared}
                coordinateSystems={[
                    {
                        label: "EPSG:25832",
                        value: "EPSG:25832"
                    },
                    {
                        label: "EPSG:4326",
                        value: "EPSG:4326"
                    },
                    {
                        label: "EPSG:3857",
                        value: "EPSG:3857"
                    },
                    {
                        label: "EPSG:25833",
                        value: "EPSG:25833"
                    },
                    {
                        label: "EPSG:31466",
                        value: "EPSG:31466"
                    },
                    {
                        label: "EPSG:31467",
                        value: "EPSG:31467"
                    },
                    {
                        label: "EPSG:3035",
                        value: "EPSG:3035"
                    }
                ]}
            />
        </Box>
    );
}
