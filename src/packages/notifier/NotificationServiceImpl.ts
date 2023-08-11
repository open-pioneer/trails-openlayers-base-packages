// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type { NotificationLevel, NotificationOptions, NotificationService } from "./api";
import { Resource, createLogger } from "@open-pioneer/core";
import type { ReactNode } from "react";
const LOG = createLogger("notifier:NotificationService");

export interface Notification {
    title: ReactNode;
    message: ReactNode;
    level: NotificationLevel;
    displayDuration: number | undefined;
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
        if (import.meta.env.DEV) {
            this.#checkTimeoutId = window.setTimeout(() => {
                this.#checkHandlerRegistration();
                this.#checkTimeoutId = undefined;
            }, 5000);
        }
    }

    destroy() {
        window.clearTimeout(this.#checkTimeoutId);
        this.#checkTimeoutId = undefined;
    }

    notify(options: NotificationOptions): void {
        this.#dispatchHandlerMethod("showNotification", {
            title: options.title ?? undefined,
            message: options.message ?? undefined,
            level: options.level ?? "info",
            displayDuration: options.displayDuration
        });
    }

    clearAll(): void {
        this.#dispatchHandlerMethod("clearAll");
    }

    registerHandler(handler: NotificationHandler): Resource {
        // We only support exactly one handler.
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
        // These happened during the time no handler was registered.
        this.#handler = handler;
        const buffered = this.#buffered;
        this.#buffered = undefined;
        if (buffered) {
            for (const [name, ...args] of buffered) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (handler[name] as any)(...args);
            }
        }

        // Return a resource to undo the registration
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

    /**
     * Calls a method on the handler (if present) or buffers the method call for later once the handler
     * has arrived.
     */
    #dispatchHandlerMethod<Method extends keyof NotificationHandler>(
        method: Method,
        ...args: Parameters<NotificationHandler[Method]>
    ): void;
    #dispatchHandlerMethod(method: keyof NotificationHandler, ...args: unknown[]): void {
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
                `No notification handler has been registered: notifications will not be visible.\n` +
                    `Make sure that your app contains the <Notifier /> component.`
            );
        }
    }
}
