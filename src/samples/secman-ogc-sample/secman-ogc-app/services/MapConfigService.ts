// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { AuthService } from "@open-pioneer/authentication";
import { MapConfig, MapConfigProvider, SimpleLayer, WMSLayer } from "@open-pioneer/map";
import { ServiceOptions } from "@open-pioneer/runtime";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

interface References {
    authService: AuthService;
}

export const MAP_ID = "main";
export class MapConfigService implements MapConfigProvider {
    mapId = MAP_ID;

    #authService: AuthService;

    constructor(options: ServiceOptions<References>) {
        this.#authService = options.references.authService;
    }

    async getMapConfig(): Promise<MapConfig> {
        // May or may not be needed: delay until authentication is no longer pending.
        // After this line, the user is either definitely logged in or logged out.
        // This makes the map configuration slower but would enable fetching capabilities or
        // other resources with a token.
        const session = await this.#authService.getSessionInfo();
        if (!session) {
            throw new Error("User is not authenticated");
        }

        return {
            initialView: {
                kind: "position",
                center: { x: 847541, y: 6793584 },
                zoom: 14
            },
            projection: "EPSG:3857",
            layers: [
                new SimpleLayer({
                    title: "OpenStreetMap",
                    olLayer: new TileLayer({
                        source: new OSM(),
                        properties: { title: "OSM" }
                    }),
                    isBaseLayer: true
                }),
                new WMSLayer({
                    title: "Straßen NRW",
                    url: "http://mylocalhost:8082/wms/strassen_nrw_wms",
                    sublayers: [
                        {
                            name: "1",
                            title: "Verwaltungen"
                        },
                        {
                            name: "4",
                            title: "Abschnitte und Äste"
                        },
                        {
                            name: "6",
                            title: "Unfälle"
                        }
                    ]
                })
            ]
        };
    }
}
