// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { it, expect } from "vitest";
import { createService } from "@open-pioneer/test-utils/services";
import { NotificationServiceImpl, Notification } from "./NotificationServiceImpl";

it("dispatches events to the notification handler", async () => {
    const service = await createService(NotificationServiceImpl, {});

    const events: unknown[] = [];

    const handlerResource = service.registerHandler({
        showNotification(notification: Notification) {
            events.push({ type: "notification", notification: notification });
        },
        closeAll() {
            events.push({ type: "closeAll" });
        }
    });

    service.notify({ title: "test" });
    expect(events).toMatchInlineSnapshot(`
      [
        {
          "notification": {
            "displayDuration": undefined,
            "level": "info",
            "message": undefined,
            "title": "test",
          },
          "type": "notification",
        },
      ]
    `);

    events.splice(0, events.length);

    service.closeAll();
    expect(events).toMatchInlineSnapshot(`
      [
        {
          "type": "closeAll",
        },
      ]
    `);

    events.splice(0, events.length);

    handlerResource.destroy();
    service.closeAll();
    expect(events).toHaveLength(0);
});

it("dispatches events to a later registered notification handler", async () => {
    const service = await createService(NotificationServiceImpl, {});

    const events: unknown[] = [];

    service.notify({ title: "test" });
    service.closeAll();
    service.notify({ title: "test2" });

    service.registerHandler({
        showNotification(notification: Notification) {
            events.push({ type: "notification", notification: notification });
        },
        closeAll() {
            events.push({ type: "closeAll" });
        }
    });

    expect(events).toMatchInlineSnapshot(`
      [
        {
          "notification": {
            "displayDuration": undefined,
            "level": "info",
            "message": undefined,
            "title": "test",
          },
          "type": "notification",
        },
        {
          "type": "closeAll",
        },
        {
          "notification": {
            "displayDuration": undefined,
            "level": "info",
            "message": undefined,
            "title": "test2",
          },
          "type": "notification",
        },
      ]
    `);
});
