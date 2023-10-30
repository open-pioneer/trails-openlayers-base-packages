// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    styles: "./measurement.css",
    entryPoints: ["index"],
    i18n: ["en", "de"]
});
