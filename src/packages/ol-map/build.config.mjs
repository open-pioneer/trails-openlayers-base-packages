// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    services: {
        MapRegistryImpl: {
            provides: ["ol-map.MapRegistry"],
            references: {
                providers: {
                    name: "ol-map.MapConfigProvider",
                    all: true
                }
            }
        }
    }
});
