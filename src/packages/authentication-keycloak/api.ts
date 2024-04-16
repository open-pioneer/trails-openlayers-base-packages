// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
/**
 * Control the automatic refreshing of authentication tokens.
 */
export interface RefreshOptions {
    /**
     * Whether token refreshing should happen automatically.
     */
    autoRefresh: boolean;
    /**
     * The interval (in milliseconds) at which token refreshing should occur.
     */
    interval: number;
    /**
     * The remaining time (in milliseconds) before token expiration.
     */
    timeLeft: number;
}
