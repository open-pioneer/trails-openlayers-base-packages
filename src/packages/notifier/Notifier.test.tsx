// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { expect, it } from "vitest";
import { createService } from "@open-pioneer/test-utils/services";
import { NotificationServiceImpl } from "./NotificationServiceImpl";
import { render, screen, waitForElementToBeRemoved, act } from "@testing-library/react";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { Notifier } from "./Notifier";

function findToastInnerElement(messageDiv: HTMLElement) {
    let currentElement = messageDiv.parentElement;
    while (currentElement) {
        if (currentElement.classList.contains("chakra-toast__inner")) {
            return currentElement;
        } else {
            currentElement = currentElement.parentElement;
        }
    }
    return undefined;
}

it("shows notifications as toasts", async () => {
    const service = await createService(NotificationServiceImpl, {});

    const services = {
        "notifier.NotificationService": service
    };

    render(
        <PackageContextProvider services={services}>
            <Notifier />
        </PackageContextProvider>
    );

    act(() => {
        service.notify({
            title: "test",
            message: <div data-testid="notification-message">Message</div>
        });
    });

    const messageDiv = await screen.findByTestId("notification-message", {});
    const toastElement = findToastInnerElement(messageDiv);

    expect(toastElement).toMatchSnapshot();
});

it("closes all notifications", async () => {
    const service = await createService(NotificationServiceImpl, {});

    const services = {
        "notifier.NotificationService": service
    };

    render(
        <PackageContextProvider services={services}>
            <Notifier />
        </PackageContextProvider>
    );

    act(() => {
        service.notify({ title: "test1" });
        service.notify({ title: "test1" });
        service.notify({ title: "test1" });
    });

    const messageElements = await screen.findAllByText("test1");
    expect(messageElements).toHaveLength(3);

    act(() => {
        service.closeAll();
    });
    await waitForElementToBeRemoved(messageElements);
    const messageElementsAfterClear = await screen.queryAllByText("test1");
    expect(messageElementsAfterClear).toHaveLength(0);
});
