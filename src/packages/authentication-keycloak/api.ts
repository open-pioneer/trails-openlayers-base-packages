// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type {
    KeycloakConfig,
    KeycloakInitOptions,
    KeycloakLoginOptions,
    KeycloakLogoutOptions
} from "keycloak-js";

/**
 * The central configuration properties of the plugin.
 *
 * An object of this type should be used as configuration for this package.
 */
export interface KeycloakProperties {
    /**
     * These properties are required by the Keycloak JavaScript adapter.
     */
    keycloakOptions: KeycloakOptions;
}

export interface KeycloakOptions {
    /**
     * The configuration details for connecting to Keycloak.
     * 'url': The URL of your Keycloak server.
     * 'realm': The realm within Keycloak.
     * 'clientId': The ID of the client application registered in Keycloak.
     */
    keycloakConfig: KeycloakConfig;

    /**
     * Control the automatic refreshing of authentication tokens.
     * 'autoRefresh': Whether token refreshing should happen automatically.
     * 'interval': The interval (in milliseconds) at which token refreshing should occur.
     * 'timeLeft': The remaining time (in milliseconds) before token expiration.
     */
    refreshOptions: RefreshOptions;

    /**
     * Define how Keycloak initializes.
     * This properties can be used:
     * 'onLoad': Specifies when Keycloak should initialize.
     * 'pkceMethod': The method used for PKCE for enhanced security.
     * 'scope': The scope of the authentication.
     *
     */
    keycloakInitOptions: Partial<KeycloakInitOptions>;

    /**
     * The URI to redirect to after logout.
     */
    keycloakLogoutOptions?: KeycloakLogoutOptions;
    /**
     * The URI to redirect to after successful login.
     */
    keycloakLoginOptions?: KeycloakLoginOptions;
}

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
