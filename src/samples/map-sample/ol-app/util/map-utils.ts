// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModel, MapPadding } from "@open-pioneer/map";
import { Geometry } from "ol/geom";

export function highlightAndZoom(map: MapModel, geometry: Geometry[]) {
    let viewPadding: MapPadding = { top: 150, right: 400, bottom: 50, left: 400 };

    if (map.olMap.getViewport().offsetWidth < 1000) {
        viewPadding = { top: 150, right: 75, bottom: 50, left: 75 };
    }

    map.highlightAndZoom(geometry, { viewPadding });
}
