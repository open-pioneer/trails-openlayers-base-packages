// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";
export default defineBuildConfig({
    services: {
        MapProvider: {
            provides: "ol-map.MapConfigProvider"
        },
        MapSpy: {
            provides: "runtime.AutoStart",
            references: {
                registry: "ol-map.MapRegistry"
            }
        }
    }
});
