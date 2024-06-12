// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { OverviewMap } from "@open-pioneer/overview-map/OverviewMap";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import { MAP_ID } from "../MapConfigProviderImpl";
import { Demo, SharedDemoOptions } from "./Demo";

export function createOverviewMapDemo({ intl }: SharedDemoOptions): Demo {
    return {
        id: "overviewMap",
        title: intl.formatMessage({ id: "demos.overviewMap.title" }),
        createModel() {
            const overviewMapLayer = new TileLayer({
                source: new OSM()
            });

            return {
                description: intl.formatMessage({ id: "demos.overviewMap.description" }),
                mainWidget: <OverviewMap mapId={MAP_ID} olLayer={overviewMapLayer} />,
                destroy() {
                    overviewMapLayer.dispose();
                }
            };
        }
    };
}
