# @open-pioneer/notifier

The `notifier` package allows any application component to emit global notifications.
Notifications are displayed by the `<Notifier />` react component in your application.

To display notifications, configure the `<Notifier />` in your app's UI.
It should be present exactly once:

```jsx
import { Notifier } from "@open-pioneer/notifier";

export function AppUI() {
    return (
        <>
            <Notifier position="top-right" />
            {/* The rest of your application */}
        </>
    );
}
```

## Usage

### Displaying notifications in an application

The `<Notifier />` must be used in your app's UI, otherwise notifications from application components will not be shown.
The following properties are supported by the Notifier:

```ts
export interface NotifierProps {
    /**
     * The position for new notifications.
     *
     * @default "top-right"
     */
    position?: "top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right";
}
```

The implementation if `<Notifier />` is currently based on [Chakra's Toast](https://chakra-ui.com/docs/components/toast).

### Emitting notifications

Reference the interface name `notifier.NotificationService` to inject an instance of `NotificationService`.
That service can be used to emit events from anywhere in the application:

```ts
const notificationService = ...; // injected
notificationService.notify({
    level: "info",
    title: "Job complete"
    message: "Optional additional message ..."
})
```

All options in `notify` are optional, but at least the `title` or `message` should be specified.

The following options are supported by the service:

```ts
export type NotificationLevel = "success" | "info" | "warning" | "error";

export interface NotificationOptions {
    /** The title of the notification. */
    title?: string | ReactNode | undefined;

    /** An optional message, shown below the title. */
    message?: string | ReactNode | undefined;

    /**
     * The level of this notification.
     * @default "info"
     */
    level?: NotificationLevel | undefined;

    /**
     * The duration (in milliseconds) how long the notification is displayed.
     * By default, notifications are displayed until they are explicitly closed by the user.
     *
     * Note that important messages should not be hidden automatically for a11y reasons.
     */
    displayDuration?: number | undefined;
}
```

### Closing all notifications

All currently displayed notifications can be cleared by calling the `clearAll` method on the `NotificationService`:

```ts
const notificationService = ...; // injected
notificationService.clearAll();
```
