// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider, registerProjections } from "@open-pioneer/map";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Stamen from "ol/source/Stamen";

registerProjections({
    "EPSG:25832":
        "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
});

export class MapProvider implements MapConfigProvider {
    mapId = "test";

    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "extent",
                extent: {
                    xMin: 665307.894194,
                    yMin: 6611497.198555,
                    xMax: 1076233.358255,
                    yMax: 6880555.538118
                }
            },
            projection: "EPSG:3857",
            layers: [
                {
                    // id: "foo",
                    title: "Watercolor",
                    layer: new TileLayer({
                        source: new Stamen({ layer: "watercolor" })
                    })
                },
                {
                    title: "OSM",
                    layer: new TileLayer({
                        source: new OSM()
                    })
                }
            ]
        };
    }
}
