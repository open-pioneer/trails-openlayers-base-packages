// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { useToast } from "@open-pioneer/chakra-integration";
import { useEvent } from "@open-pioneer/react-utils";
import { useService } from "open-pioneer:react-hooks";
import { ReactElement, useEffect } from "react";
import { InternalNotificationAPI, Notification } from "./NotificationServiceImpl";

export interface NotifierProps {
    position?: "top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right";
}

export function Notifier(props: NotifierProps): ReactElement {
    const { position = "top" } = props;
    const toast = useToast();
    const notifications = useService("notifier.NotificationService") as InternalNotificationAPI;
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

    useEffect(() => {
        const handle = notifications.on("new-notification", showNotification);
        return () => handle.destroy();
    }, [notifications, showNotification]);

    // No actual UI representation right now
    return <></>;
}
