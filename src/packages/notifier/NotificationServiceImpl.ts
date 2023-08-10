// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type { NotificationLevel, NotificationOptions, NotificationService } from "./api";
import { Resource, createLogger } from "@open-pioneer/core";
const LOG = createLogger("notifier:NotificationService");

export interface Notification {
    title: string;
    message: string | undefined;
    level: NotificationLevel;
}

/**
 * The notification handler is implemented by the UI in order to receive events.
 * There can only be one handler at a time.
 *
 * Calls to the handler may be buffered to allow for notifications before the UI has become ready.
 */
export interface NotificationHandler {
    /** Called by the service to emit the notification. */
    showNotification(notification: Notification): void;

    /** Removes all active notifications. */
    clearAll(): void;
}

export interface InternalNotificationAPI extends NotificationService {
    /**
     * Registers the notification handler.
     * The returned resource can be used to unregister it again.
     */
    registerHandler(handler: NotificationHandler): Resource;
}

export class NotificationServiceImpl implements InternalNotificationAPI {
    #handler: NotificationHandler | undefined;
    #buffered: [keyof NotificationHandler, ...unknown[]][] | undefined;
    #checkTimeoutId: number | undefined;

    constructor() {
        this.#checkTimeoutId = window.setTimeout(() => {
            this.#checkHandlerRegistration();
            this.#checkTimeoutId = undefined;
        }, 5000);
    }

    destroy() {
        window.clearTimeout(this.#checkTimeoutId);
        this.#checkTimeoutId = undefined;
    }

    notify(options: NotificationOptions): void {
        this.#callOrBuffer("showNotification", {
            title: options.title,
            message: options.message ?? undefined,
            level: options.level ?? "info"
        });
    }

    clearAll(): void {
        this.#callOrBuffer("clearAll");
    }

    registerHandler(handler: NotificationHandler): Resource {
        if (this.#handler) {
            LOG.warn(
                "A notification handler has already been registered; this new handler will be ignored.\n" +
                    "The <Notifier /> component has likely been used twice in your application."
            );
            return {
                destroy() {
                    return undefined;
                }
            };
        }

        // Dispatch buffered calls (if any).
        this.#handler = handler;
        const buffered = this.#buffered;
        this.#buffered = undefined;
        if (buffered) {
            for (const [name, ...args] of buffered) {
                console.debug("dispatch buffered event", name, args);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (handler[name] as any)(...args);
            }
        }

        let destroyed = false;
        return {
            destroy: () => {
                if (destroyed) {
                    return;
                }

                destroyed = true;
                if (this.#handler === handler) {
                    this.#handler = undefined;
                }
            }
        };
    }

    #callOrBuffer<Method extends keyof NotificationHandler>(
        method: Method,
        ...args: Parameters<NotificationHandler[Method]>
    ): void;
    #callOrBuffer(method: keyof NotificationHandler, ...args: unknown[]): void {
        if (this.#handler) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.#handler[method] as any)(...args);
        } else {
            (this.#buffered ??= []).push([method, ...args]);
        }
    }

    #checkHandlerRegistration() {
        if (!this.#handler) {
            LOG.warn(
                `No notification handler has been registered: notifications will not be visilbe.\n` +
                    `Make sure that your app contains the <Notifier /> component.`
            );
        }
    }
}
