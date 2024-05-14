# @open-pioneer/authentication-keycloak

This package provide a plugin for the [authentication package](https://github.com/open-pioneer/trails-core-packages/blob/main/src/packages/authentication/README.md#implementing-an-authentication-plugin) that supports [Keycloak](https://www.keycloak.org/).

The package implements an actual authentication flow using the [Keycloak JavaScript](#https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter) adapter.
For further Information, how Keycloak works please visit the official documentation of [Keycloak](https://www.keycloak.org/).

> **_NOTE:_** The package only works with the central [authentication package](https://github.com/open-pioneer/trails-core-packages/blob/main/src/packages/authentication/README.md#implementing-an-authentication-plugin).

## Usage

To use the package in your app, first import the `<ForceAuth />` component from the [authentication package](https://github.com/open-pioneer/trails-core-packages/blob/main/src/packages/authentication/README.md#enforcing-authentication) to make sure that only logged in users can use the application.

`ForceAuth` renders its children (your application) if the user is authenticated.
Otherwise, it redirect the user to the Keycloak authentication provider.

To access the `SessionInfo` for the current logged in user, you can use the `useAuthState` hook provided by the authentication package.

```tsx
// AppUI.tsx
import { ForceAuth, useAuthState } from "@open-pioneer/authentication";
import { useService } from "open-pioneer:react-hooks";

export function AppUI() {
    const authService = useService<AuthService>("authentication.AuthService");
    const authState = useAuthState(authService);
    const sessionInfo = authState.kind == "authenticated" ? authState.sessionInfo : undefined;
    const userName = sessionInfo?.attributes?.userName as string;

    return (
        <ForceAuth>
            <Text>Logged in as: {userName}</Text>
            <TheRestOfYourApplication />
        </ForceAuth>
    );
}
```

### Keycloak configuration properties

To configure the `authentication-keycloak` package, adjust these properties.
For more details on the configuration properties, please visit the official documentation [API Reference](https://www.keycloak.org/docs/latest/securing_apps/index.html#api-reference).

| Property            |        Type         |                                                                                                           Description |                                                         Default |
| ------------------- | :-----------------: | --------------------------------------------------------------------------------------------------------------------: | --------------------------------------------------------------: |
| refreshOptions      |   RefreshOptions    |                            Configure token refresh behavior and manage access token lifecycle in client applications. |             `{autoRefresh: true, interval: 6000, timeLeft: 70}` |
| keycloakInitOptions | KeycloakInitOptions |                                               Configure Keycloak's behavior during client application initialization. | `{onLoad: "check-sso", pkceMethod: "S256", scope: "data:read"}` |
| keycloakConfig      |   KeycloakConfig    | The configuration settings required to establish a connection between the client application and the Keycloak server. |                                                                 |

```ts
interface RefreshOptions {
    autoRefresh: boolean;
    interval: number;
    timeLeft: number;
}
interface KeycloakInitOptions {
    onLoad: string;
    pkceMethod: string;
    scope: string;
}
interface KeycloakConfig {
    url: string;
    realm: string;
    clientId: string;
}
```

### Using the configuration in an app

```ts
// app.ts
import { KeycloakProperties } from "@open-pioneer/authentication-keycloak";
import { createCustomElement } from "@open-pioneer/runtime";
import * as appMetadata from "open-pioneer:app";
import { AppUI } from "./AppUI";

const element = createCustomElement({
    component: AppUI,
    appMetadata,
    config: {
        properties: {
            "@open-pioneer/authentication-keycloak": {
                keycloakOptions: {
                    refreshOptions: {
                        autoRefresh: true,
                        interval: 6000,
                        timeLeft: 70
                    },
                    keycloakInitOptions: {
                        onLoad: "check-sso",
                        pkceMethod: "S256"
                        // additional configuration, for example:
                        // scope: "data:read"
                    },
                    keycloakConfig: {
                        url: "http://keycloak-server/base_path",
                        realm: "myrealm",
                        clientId: "myapp"
                    }
                }
            } satisfies KeycloakProperties // for auto completion / validation
        }
    }
    // ...
});
```

### Accessing the Keycloak token in your application

After a successful login, the Keycloak token can be accessed from the `SessionInfo` of the `AuthService`.

```ts
//SampleTokenInterceptor.ts
import { AuthService } from "@open-pioneer/authentication";
import { ServiceOptions } from "@open-pioneer/runtime";
// ...

class SampleTokenInterceptor implements Interceptor {
    private authService: AuthService;

    constructor(options: ServiceOptions<References>) {
        this.authService = options.references.authService;
    }

    beforeRequest({ target, options }: BeforeRequestParams): void {
        const authState = this.authService.getAuthState();
        const sessionInfo = authState.kind == "authenticated" ? authState.sessionInfo : undefined;
        const keycloak = sessionInfo?.attributes?.keycloak;
        const token = (keycloak as { token: string }).token;
        // ...
    }
}
```

## License

Apache-2.0 (see `LICENSE` file)
