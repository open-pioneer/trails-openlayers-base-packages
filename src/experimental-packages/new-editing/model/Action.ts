// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { FeatureTemplate } from "./FeatureTemplate";

interface CreateAction {
    readonly type: "create";
    readonly template: FeatureTemplate;
}

interface UpdateAction {
    readonly type: "update";
}

export type Action = CreateAction | UpdateAction;
