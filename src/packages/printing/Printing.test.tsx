// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from "vitest";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { Printing } from "./Printing";
import { NotificationService } from "@open-pioneer/notifier";
import userEvent from "@testing-library/user-event";

it("should successfully create a printing component", async () => {
    await createPrinting();

    // printing is mounted
    const { printingDiv, printingInput, printingSelect } = await waitForPrinting();
    expect(printingDiv).toMatchSnapshot();

    // check printing input and select are available
    expect(printingInput.tagName).toBe("INPUT");
    expect(printingSelect.tagName).toBe("SELECT");
});

it("should successfully type into title input field and select file format", async () => {
    const user = userEvent.setup();
    await createPrinting();

    const { printingInput, printingSelect } = await waitForPrinting();

    await user.type(printingInput, "test title");
    expect(printingInput).toHaveValue("test title");

    act(() => {
        fireEvent.change(printingSelect, { target: { value: "pdf" } });
    });
    expect(printingSelect.value).toBe("pdf");
});

async function createPrinting() {
    const { mapId, registry } = await setupMap();

    const notifier: Partial<NotificationService> = {
        notify() {
            throw new Error("not implemented");
        }
    };

    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    injectedServices["notifier.NotificationService"] = notifier;

    render(
        <PackageContextProvider services={injectedServices}>
            <Printing mapId={mapId} data-testid="printing"></Printing>
        </PackageContextProvider>
    );
}

async function waitForPrinting() {
    const { printingDiv, printingInput, printingSelect } = await waitFor(async () => {
        const printingDiv: HTMLDivElement | null =
            await screen.findByTestId<HTMLDivElement>("printing");
        if (!printingDiv) {
            throw new Error("Printing not rendered");
        }

        const printingInput = printingDiv.getElementsByTagName("input")[0];

        if (!printingInput) {
            throw new Error("Printing input not rendered");
        }

        const printingSelect = printingDiv.querySelector<HTMLSelectElement>(".printing-select");

        if (!printingSelect) {
            throw new Error("Printing select not rendered");
        }

        return { printingDiv, printingInput, printingSelect };
    });

    return { printingDiv, printingInput, printingSelect };
}
