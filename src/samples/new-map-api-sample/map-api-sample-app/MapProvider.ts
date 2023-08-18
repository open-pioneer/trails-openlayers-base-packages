// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider } from "@open-pioneer/ol-map";

export class MapProvider implements MapConfigProvider {
    mapId = "test";

    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: {
                    x: 123,
                    y: 456
                },
                zoom: 5
            },
            projection: "EPSG:4326"
        };
    }
}
