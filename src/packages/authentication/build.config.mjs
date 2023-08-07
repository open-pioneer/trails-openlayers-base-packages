// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    entryPoints: ["index"],
    services: {
        AuthServiceImpl: {
            provides: "authentication.AuthService",
            references: {}
        }
    },
    ui: {
        references: ["authentication.AuthService"]
    },
    publishConfig: {
        strict: true
    }
});
