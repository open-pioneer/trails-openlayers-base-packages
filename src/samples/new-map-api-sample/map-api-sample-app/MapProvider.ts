// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider, registerProjections } from "@open-pioneer/ol-map";

registerProjections({
    "EPSG:25832": "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
});

export class MapProvider implements MapConfigProvider {
    mapId = "test";

    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: {
                    x: 405948.17,
                    y: 5757572.85
                },
                zoom: 10,
            },
            projection: "EPSG:25832"
        };
    }
}
