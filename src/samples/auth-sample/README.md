# auth-sample

This example demonstrates the `<ForceAuth />` component and the `AuthPlugin`-API supported by the `authentication` package.

The content of the application is protected: only authenticated users can interact with it.
If a user is not logged in, a login fallback (a simple login form) is presented to the user instead.
Once a user has logged in, the content of the application becomes visible.
A logout button can be used to end the session (hiding the content again).

The `TestAuthPlugin` in this example only does trivial access control by comparing the entered user name and password with hard coded strings ("admin" / "admin").
A real implementation would send the credentials to a backend to begin a session.
