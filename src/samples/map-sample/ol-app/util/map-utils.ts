// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModel } from "@open-pioneer/map";
import { Geometry } from "ol/geom";

export function highlightAndZoom(map: MapModel, geometry: Geometry[]) {
    const viewport: HTMLElement = map.olMap.getViewport();

    map.highlightAndZoom(geometry, {
        viewPadding:
            viewport && viewport.offsetWidth < 1000
                ? { top: 150, right: 75, bottom: 50, left: 75 }
                : { top: 150, right: 400, bottom: 50, left: 400 }
    });
}
