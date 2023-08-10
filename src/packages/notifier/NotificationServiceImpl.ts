// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type { NotificationLevel, NotificationOptions, NotificationService } from "./api";
import { EventSource, EventEmitter } from "@open-pioneer/core";

export interface Notification {
    title: string;
    message: string | undefined;
    level: NotificationLevel;
}

export interface InternalNotifierEvents {
    "new-notification": Notification;
}

export interface InternalNotificationAPI
    extends NotificationService,
        EventSource<InternalNotifierEvents> {}

export class NotificationServiceImpl
    extends EventEmitter<InternalNotifierEvents>
    implements InternalNotificationAPI
{
    notify(options: NotificationOptions): void {
        this.emit("new-notification", {
            title: options.title,
            message: options.message ?? undefined,
            level: options.level ?? "info"
        });
    }
}
