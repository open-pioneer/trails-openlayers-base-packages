// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Layer } from "@open-pioneer/map";
import type { DeclaredService } from "@open-pioneer/runtime";

export interface Editing extends DeclaredService<"editing.Editing"> {
    startEditing(layer: Layer): void;

    stopEditing(): void;
}
