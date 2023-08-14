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
Otherwise, it will render the authentication plugin's _fallback_ component (see below).
It will be updated correctly if the authentication state changes.

#### _Fallback_

If the user is not logged in, some _fallback_ is shown to the user.
The _fallback_ must be implemented in the authentication plugin. Depending on the implementation of the authentication plugin,
a fallback may be a login prompt, or as a simple message.
Some plugins do not provide a visual fallback but an "effect" instead: an action to perform, such as a redirect to the authentication provider.

Rendering of the login fallback can be customized by passing custom properties (`fallbackProps`) or by supplying a custom render function (`renderFallback`), see the API documentation.

### Triggering logout

Call the `AuthService`'s `logout()` method to explicitly end the current session:

```js
const authService = ...; // injected
authService.logout();
```

### Implementing an authentication plugin

An authentication plugin (providing `authentication.AuthPlugin`) must be present in the application to support authentication.
The plugin implements the actual authentication flow.

The plugin must implement the `AuthPlugin` TypeScript interface exported by this package:

-   Provide the current authentication state by implementing `getAuthState()`.
    When authenticated, a user's authentication state contains session information, such as the user's `id`,
    an optional display name and arbitrary additional `attributes` that can be defined by the plugin.

    If the state changes internally (e.g. successful login, explicit logout, logout due to timeout, etc.),
    the `changed` event must be emitted to notify the `AuthService`.

-   Return the login behavior value (a React component or a function to call) by implementing `getLoginBehavior()`.
    This could be a login dialog, a "forbidden" message (_"fallback"_) or a function implementing a redirect ("effect").

-   Implement the `logout()` method: this method will be called when the user attempts to end their session.

A simple example is available in this project's `auth-sample`.
