// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    entryPoints: ["index"],
    styles: "./ui/styles.css",
    services: {
        MapRegistryImpl: {
            provides: ["map.MapRegistry"],
            references: {
                providers: {
                    name: "map.MapConfigProvider",
                    all: true
                }
            }
        }
    },
    ui: {
        references: ["map.MapRegistry"]
    }
});
