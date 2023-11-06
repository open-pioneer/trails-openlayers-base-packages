// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useToast } from "@open-pioneer/chakra-integration";
import { useEvent } from "@open-pioneer/react-utils";
import { useService } from "open-pioneer:react-hooks";
import { ReactElement, useEffect, useState } from "react";
import { InternalNotificationAPI, Notification } from "./NotificationServiceImpl";
import { WarningTwoIcon } from "@chakra-ui/icons";

/** Props supported by the {@link Notifier} component. */
export interface NotifierProps {
    /**
     * The position for new notifications.
     *
     * @default "top-right"
     */
    position?: "top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right";
}

const isDev = import.meta.env.DEV;

/**
 * Shows notifications sent via the `NotificationService`.
 *
 * Only one instance of `<Notifier />` should be present in the application.
 * It currently does not matter where the Notifier is located in the react tree.
 *
 * ```ts
 * import { Notifier } from "@open-pioneer/notifier";
 *
 * export function AppUI() {
 *     return (
 *         <>
 *             <Notifier position="top-right" />
 *             <h1>Your application</h1>
 *         </>
 *     );
 * }
 * ```
 */
export function Notifier(props: NotifierProps): ReactElement {
    const { position = "top-right" } = props;
    const toast = useToast();
    const notifications = useService("notifier.NotificationService") as InternalNotificationAPI;
    const [ready, setReady] = useState(!isDev);

    const showNotification = useEvent((notification: Notification) => {
        // use different icons for warning and error
        const icon =
            notification.level === "error" ? <WarningTwoIcon h="100%" w="100%" /> : undefined;
        toast({
            position,
            title: notification.title,
            description: notification.message || null,
            status: notification.level,
            isClosable: true,
            duration: notification.displayDuration ?? null, // Null: does not auto-close
            icon
        });
    });
    const closeAll = useEvent(() => {
        toast.closeAll();
    });

    useEffect(() => {
        /*
         * Delay registering the notification handler a bit during development.
         * Chakra's toast implementation clears its store when it gets unmounted.
         * During development, that may also happen during initialization because of React's
         * StrictMode (https://react.dev/reference/react/StrictMode).
         *
         * Unfortunately, that means that toasts that were emitted very early (such as in service constructors)
         * will be deleted. Waiting for a few milliseconds prevents this issue and has no effect on production.
         */
        if (isDev && !ready) {
            const id = setTimeout(() => setReady(true), 100);
            return () => clearTimeout(id);
        }

        const handle = notifications.registerHandler({
            showNotification,
            closeAll
        });
        return () => handle.destroy();
    }, [ready, notifications, showNotification, closeAll]);

    // No actual UI representation right now
    return <></>;
}
