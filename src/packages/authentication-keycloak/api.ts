// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import "@open-pioneer/runtime";

export interface RefreshOptions {
    autoRefresh: boolean;
    interval: number;
    timeLeft: number;
}
export interface KeycloakOptions {
    url: string;
    realm: string;
    clientId: string;
}
