// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    entryPoints: ["index"],
    i18n: ["en", "de"],
    styles: "./styles.css",
    services: {
        PrintingServiceImpl: {
            provides: "printing.PrintingService"
        }
    },
    ui: {
        references: ["notifier.NotificationService", "printing.PrintingService"]
    },
    publishConfig: {
        strict: true
    }
});
