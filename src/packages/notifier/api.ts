// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
export type NotificationLevel = "success" | "info" | "warning" | "error";

/**
 * Options used when emitting a new notification via {@link NotificationService.notify}.
 */
export interface NotificationOptions {
    /** The title of the notification. */
    title: string;

    /** An optional message, shown below the title. */
    message?: string;

    /**
     * The level of this notification.
     * @default "info"
     */
    level?: NotificationLevel;
}

/**
 * The `NotificationService` allows any part of the application to emit
 * notifications to the user.
 *
 * You can inject an instance of this service by referencing the interface name `notifier.NotificationService`.
 */
export interface NotificationService {
    /**
     * Emits a new notification.
     *
     * Notifications are shown by the `<Notifier />` component,
     * which must be present in your application.
     *
     * @param options Options for the new notification.
     */
    notify(options: NotificationOptions): void;

    /** Clears all active notifications. */
    clearAll(): void;
}

import "@open-pioneer/runtime";
declare module "@open-pioneer/runtime" {
    interface ServiceRegistry {
        "notifier.NotificationService": NotificationService;
    }
}
