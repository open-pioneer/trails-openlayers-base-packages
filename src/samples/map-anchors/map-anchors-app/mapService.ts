// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { type DECLARE_SERVICE_INTERFACE, Service, ServiceOptions } from "@open-pioneer/runtime";
import { MapModel, MapRegistry, SimpleLayer } from "@open-pioneer/map";
import { References } from "showcase-app/model/AppInitModel";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

const MAP_ID = "main";

export class MapService implements Service {
    declare [DECLARE_SERVICE_INTERFACE]: "mapAnchor.mapService";
    #registry: MapRegistry = {} as MapRegistry;
    #mapModel?: MapModel;
    constructor(options: ServiceOptions<References>) {
        this.#registry = options.references.mapRegistry;
        this.#registry
            .createMap(MAP_ID, {
                initialView: {
                    kind: "position",
                    center: { x: 404747, y: 5757920 },
                    zoom: 14
                },
                layers: [
                    new SimpleLayer({
                        title: "OSM",
                        isBaseLayer: true,
                        olLayer: new TileLayer({
                            source: new OSM()
                        })
                    })
                ]
            })
            .then((result) => {
                this.#mapModel = result;
            });
    }
    getMap(): MapModel | undefined {
        return this.#mapModel;
    }
}
