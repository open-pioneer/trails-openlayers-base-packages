// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { setupMap } from "@open-pioneer/map-test-utils";
import { NotificationService } from "@open-pioneer/notifier";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, getByRole, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { disableReactActWarnings } from "test-utils";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Printing } from "./Printing";
import * as PrintingControllerModule from "./PrintingController";

const setFileFormatSpy = vi.fn();
const setTitleSpy = vi.fn();
const setViewPaddingSpy = vi.fn();
const handleMapExportSpy = vi.fn((..._args) => Promise.resolve());
const notifySpy = vi.fn();

/** Mock implementation used by the UI. */
class MockPrintingController {
    setTitle = setTitleSpy;
    setFileFormat = setFileFormatSpy;
    setViewPadding = setViewPaddingSpy;
    handleMapExport = handleMapExportSpy;

    destroy() {}
}

beforeEach(() => {
    disableReactActWarnings();

    // https://vitest.dev/guide/mocking.html#cheat-sheet
    vi.spyOn(PrintingControllerModule, "PrintingController", "get").mockReturnValue(
        MockPrintingController as any
    );
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

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

it("should trigger the map export with the requested title and the request format", async () => {
    const user = userEvent.setup();
    await createPrinting();

    const { printingInput, printingSelect, printingButton } = await waitForPrinting();

    await user.type(printingInput, "test title");
    act(() => {
        fireEvent.change(printingSelect, { target: { value: "pdf" } });
    });

    await user.click(printingButton);

    expect(handleMapExportSpy).toHaveBeenCalledOnce();
    expect(handleMapExportSpy.mock.lastCall![0]).toEqual({
        "fileFormat": "pdf",
        "title": "test title"
    });
});

it("should trigger a notification if the map export fails", async () => {
    // Fake an error from the export and silence error output
    handleMapExportSpy.mockRejectedValue(new Error("Error from map export"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const user = userEvent.setup();
    await createPrinting();

    const { printingButton } = await waitForPrinting();

    await user.click(printingButton);

    // Expect a notification
    expect(handleMapExportSpy).toHaveBeenCalledOnce();
    expect(notifySpy).toHaveBeenCalledOnce();
    expect(notifySpy.mock.lastCall![0]).toMatchInlineSnapshot(`
      {
        "level": "error",
        "message": "printingFailed",
      }
    `);

    // Expect message in the log
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        "[ERROR] printing: Failed to print the map",
        [Error: Error from map export],
      ]
    `);
});

async function createPrinting() {
    const { map } = await setupMap();

    const notifier: Partial<NotificationService> = {
        notify: notifySpy
    };

    const injectedServices: Record<string, unknown> = {};
    injectedServices["notifier.NotificationService"] = notifier;
    injectedServices["printing.PrintingService"] = {}; // used via useService, but never called because controller was mocked

    render(
        <PackageContextProvider services={injectedServices}>
            <Printing map={map} data-testid="printing"></Printing>
        </PackageContextProvider>
    );
}

async function waitForPrinting() {
    return await waitFor(async () => {
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

        const printingButton = getByRole(printingDiv, "button");
        return { printingDiv, printingInput, printingSelect, printingButton };
    });
}
