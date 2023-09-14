// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    entryPoints: ["index"],
    services: {
        NotificationServiceImpl: {
            provides: "notifier.NotificationService"
        }
    },
    publishConfig: {
        strict: true
    },
    ui: {
        references: ["notifier.NotificationService"]
    }
});
