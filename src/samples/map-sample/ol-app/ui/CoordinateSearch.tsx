// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMapModel } from "@open-pioneer/map";
import { useService } from "open-pioneer:react-hooks";
import { AppModel } from "../AppModel";
import { MAP_ID } from "../map/MapConfigProviderImpl";
import { CoordinateSearch } from "@open-pioneer/coordinate-search";
import { Coordinate } from "ol/coordinate";
import { Point } from "ol/geom";

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
        <CoordinateSearch
            mapId={MAP_ID}
            onSelect={({ coords }) => onCoordinateSearch(coords)}
            onClear={onSearchCleared}
        />
    );
}
