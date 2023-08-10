// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { useToast } from "@open-pioneer/chakra-integration";
import { useEvent } from "@open-pioneer/react-utils";
import { useService } from "open-pioneer:react-hooks";
import { ReactElement, useEffect, useState } from "react";
import { InternalNotificationAPI, Notification } from "./NotificationServiceImpl";

export interface NotifierProps {
    position?: "top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right";
}

const isDev = import.meta.env.DEV;

export function Notifier(props: NotifierProps): ReactElement {
    const { position = "top" } = props;
    const toast = useToast();
    const notifications = useService("notifier.NotificationService") as InternalNotificationAPI;
    const [ready, setReady] = useState(!isDev);

    const showNotification = useEvent((notification: Notification) => {
        toast({
            position,
            title: notification.title,
            description: notification.message || null,
            status: notification.level,
            isClosable: true,
            duration: null // Null: does not auto-close
        });
    });
    const clearAll = useEvent(() => {
        toast.closeAll();
    });

    useEffect(() => {
        /**
         * Delay registering the notification handler a bit during development.
         * Chakra's toast implementation clears its store when it gets unmounted.
         * During development, that may also happen during initialization because of react's
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
            clearAll
        });
        return () => handle.destroy();
    }, [ready, notifications, showNotification, clearAll]);

    // No actual UI representation right now
    return <></>;
}
