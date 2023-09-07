// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider } from "@open-pioneer/map";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Stamen from "ol/source/Stamen";
import { registerProjections } from "@open-pioneer/map";

export const MAP_ID = "main";

/**
 * Register custom projection to the global proj4js definitions.
 */
registerProjections({
    "EPSG:25832":
        "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
});

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 404747, y: 5757920 },
                zoom: 14
            },
            projection: "EPSG:25832",
            layers: [
                {
                    id: "b-1",
                    title: "OSM",
                    isBaseLayer: true,
                    visible: false,
                    layer: new TileLayer({
                        source: new OSM()
                    })
                },
                {
                    title: "Watercolor",
                    visible: false,
                    layer: new TileLayer({
                        source: new Stamen({ layer: "watercolor" })
                    })
                },
                {
                    id: "b-2",
                    title: "Toner",
                    isBaseLayer: true,
                    visible: true,
                    layer: new TileLayer({
                        source: new Stamen({ layer: "toner" })
                    })
                }
            ]
        };
    }
}
