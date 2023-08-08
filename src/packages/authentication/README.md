# @open-pioneer/authentication

The authentication package implements a central service to handle the current user's session.

## Authentication plugins

The authentication package cannot be used on its own: it requires a service providing `authentication.AuthPlugin` to be present in the application.
The plugin must implement the actual authentication flow.

See [below](#implementing-an-authentication-plugin) for how to implement an authentication plugin.

TODO(future release): Packages implementing authentication plugins, e.g. `authentication-keycloak`?

## Use cases

### Retrieving the current authentication state

To inspect the current authentication state, inject a reference to the `AuthService` by referencing `"authentication.AuthService"`.

The methods `getAuthState()` and `getSessionInfo()` return information about the current state:

```js
const authService = ...; // injected

// Returns SessionInfo if the user is currently logged in, or undefined otherwise.
const sessionInfo = await authService.getSessionInfo();

// Like the above, but synchronous and includes intermediate states like "pending".
const state = authService.getAuthState();

// Use `on("changed", ...)` to be notified about changes.
const handle = authService.on("changed", () => {
    const newState = authService.getAuthState();
});

// Don't forget to clean up event handles in the future
handle.destroy();
```

### Enforcing authentication

Some applications require the user to be always logged in.
If that is not the case, the user is to be presented with some _Fallback_.
Depending on the authentication plugin used by the application, a fallback may be implemented as a login prompt, or as a redirect to another website.

Authentication can be enforced by wrapping the application with the `<ForceAuth />` component:

```jsx
// AppUI.jsx
import { ForceAuth } from "@open-pioneer/authentication";

export function AppUI() {
    return (
        <ForceAuth>
            <TheRestOfYourApplication />
        </ForceAuth>
    );
}
```

`ForceAuth` will render its children (your application) if the user is authenticated.
Otherwise, it will render the authentication plugin's fallback component.
It will be updated correctly if the authentication state changes.

Rendering of the login fallback can be customized by passing custom properties (`fallbackProps`) or by supplying a custom render function (`renderFallback`), see the API documentation.

### Triggering logout

TODO

### Implementing an authentication plugin

TODO
