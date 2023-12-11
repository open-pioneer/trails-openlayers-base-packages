// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    entryPoints: ["index"],
    services: {
        NotificationServiceImpl: {
            provides: "notifier.NotificationService"
        }
    },
    ui: {
        references: ["notifier.NotificationService"]
    },
    publishConfig: {
        strict: true
    }
});
