// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Layer } from "@open-pioneer/map";

export interface Editing {
    startEditing(layer: Layer): void;

    stopEditing(): void;
}
