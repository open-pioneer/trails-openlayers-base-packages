// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { createManualPromise } from "@open-pioneer/core";
import { LayerFactory, MapModel } from "@open-pioneer/map";
import { setupMap } from "@open-pioneer/map-test-utils";
import { NotificationService } from "@open-pioneer/notifier";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, getByRole, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { disableReactActWarnings } from "test-utils";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Printing, PrintingProps } from "./Printing";
import * as PrintingControllerModule from "./PrintingController";
import * as utils from "./utils";
import { PageSize } from "./utils";

const { promise, resolve } = createManualPromise();
const handleMapExportPromise = promise;
const setFileFormatSpy = vi.fn();
const setTitleSpy = vi.fn();
const setViewPaddingSpy = vi.fn();
const setPageFormatSpy = vi.fn();
const setOrientationSpy = vi.fn();
const setScaleSpy = vi.fn();
const handleMapExportSpy = vi.fn((..._args) => handleMapExportPromise);
const notifySpy = vi.fn();

/** Mock implementation used by the UI. */
class MockPrintingController {
    setTitle = setTitleSpy;
    setFileFormat = setFileFormatSpy;
    setViewPadding = setViewPaddingSpy;
    setPageFormat = setPageFormatSpy;
    setOrientation = setOrientationSpy;
    setScale = setScaleSpy;
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
    const {
        printingDiv,
        printingInput,
        printingSelectPageFormat,
        printingSelectOrientation,
        printingSelectScale,
        printingSelectDpi,
        printingSelectFileFormat,
        printingButton
    } = await waitForPrinting();
    expect(printingDiv).toMatchSnapshot();

    // check printing input and selects are available
    expect(printingInput.tagName).toBe("INPUT");
    expect(printingSelectPageFormat.tagName).toBe("SELECT");
    expect(printingSelectOrientation.tagName).toBe("SELECT");
    expect(printingSelectScale.tagName).toBe("SELECT");
    expect(printingSelectDpi.tagName).toBe("SELECT");
    expect(printingSelectFileFormat.tagName).toBe("SELECT");
    expect(printingButton.tagName).toBe("BUTTON");
});

it("should successfully type into title input field and select options", async () => {
    const user = userEvent.setup();
    await createPrinting();

    const {
        printingInput,
        printingSelectPageFormat,
        printingSelectOrientation,
        printingSelectScale,
        printingSelectDpi,
        printingSelectFileFormat
    } = await waitForPrinting();

    await user.type(printingInput, "test title");
    expect(printingInput).toHaveValue("test title");

    act(() => {
        fireEvent.change(printingSelectPageFormat, { target: { value: "a5" } });
    });
    expect(printingSelectPageFormat.value).toBe("a5");

    act(() => {
        fireEvent.change(printingSelectOrientation, { target: { value: "portrait" } });
    });
    expect(printingSelectOrientation.value).toBe("portrait");

    act(() => {
        fireEvent.change(printingSelectScale, { target: { value: "10000" } });
    });
    expect(printingSelectScale.value).toBe("10000");

    act(() => {
        fireEvent.change(printingSelectDpi, { target: { value: "96" } });
    });
    expect(printingSelectDpi.value).toBe("96");

    act(() => {
        fireEvent.change(printingSelectFileFormat, { target: { value: "pdf" } });
    });
    expect(printingSelectFileFormat.value).toBe("pdf");
});

it("should use default options when no options are provided in props", async () => {
    await createPrinting();

    const printingDiv: HTMLDivElement | null =
        await screen.findByTestId<HTMLDivElement>("printing");
    if (!printingDiv) {
        throw new Error("Printing not rendered");
    }

    const {
        printingSelectPageFormat,
        printingSelectOrientation,
        printingSelectScale,
        printingSelectDpi,
        printingSelectFileFormat
    } = await waitForPrinting();

    const pageFormatOptions = within(printingSelectPageFormat!).getAllByRole("option");
    const pageFormatValues = pageFormatOptions.map((opt) => opt.getAttribute("value"));
    expect(pageFormatValues).toEqual(["a3", "a4", "a5"]);

    const orientationOptions = within(printingSelectOrientation!).getAllByRole("option");
    const orientationValues = orientationOptions.map((opt) => opt.getAttribute("value"));
    expect(orientationValues).toEqual(["landscape", "portrait"]);

    const scaleOptions = within(printingSelectScale!).getAllByRole("option");
    const scaleValues = scaleOptions.map((opt) => opt.getAttribute("value"));
    expect(scaleValues).toEqual([
        "2500000",
        "2000000",
        "1500000",
        "1000000",
        "750000",
        "500000",
        "300000",
        "250000",
        "200000",
        "150000",
        "100000",
        "75000",
        "50000",
        "25000",
        "20000",
        "15000",
        "10000",
        "7500",
        "5000",
        "2500",
        "2000",
        "1500",
        "1000",
        "500",
        "250",
        "100"
    ]);

    const dpiOptions = within(printingSelectDpi!).getAllByRole("option");
    const dpiValues = dpiOptions.map((opt) => opt.getAttribute("value"));
    expect(dpiValues).toEqual(["96", "150", "300"]);

    const fileFormatOptions = within(printingSelectFileFormat!).getAllByRole("option");
    const fileFormatValues = fileFormatOptions.map((opt) => opt.getAttribute("value"));
    expect(fileFormatValues).toEqual(["png", "pdf"]);

    expect(setViewPaddingSpy.mock.lastCall![0]).toBe("auto");
});

it("should use options provided in props", async () => {
    await createPrinting({
        dpis: [123, 456],
        fileFormats: ["pdf"],
        pageFormats: ["a5"],
        pageOrientations: ["portrait"],
        scales: [78000, 900]
    });

    const printingDiv: HTMLDivElement | null =
        await screen.findByTestId<HTMLDivElement>("printing");
    if (!printingDiv) {
        throw new Error("Printing not rendered");
    }

    const {
        printingSelectPageFormat,
        printingSelectOrientation,
        printingSelectScale,
        printingSelectDpi,
        printingSelectFileFormat
    } = await waitForPrinting();

    const pageFormatOptions = within(printingSelectPageFormat!).getAllByRole("option");
    const pageFormatValues = pageFormatOptions.map((opt) => opt.getAttribute("value"));
    expect(pageFormatValues).toEqual(["a5"]);

    const orientationOptions = within(printingSelectOrientation!).getAllByRole("option");
    const orientationValues = orientationOptions.map((opt) => opt.getAttribute("value"));
    expect(orientationValues).toEqual(["portrait"]);

    const scaleOptions = within(printingSelectScale!).getAllByRole("option");
    const scaleValues = scaleOptions.map((opt) => opt.getAttribute("value"));
    expect(scaleValues).toEqual(["78000", "900"]);

    const dpiOptions = within(printingSelectDpi!).getAllByRole("option");
    const dpiValues = dpiOptions.map((opt) => opt.getAttribute("value"));
    expect(dpiValues).toEqual(["123", "456"]);

    const fileFormatOptions = within(printingSelectFileFormat!).getAllByRole("option");
    const fileFormatValues = fileFormatOptions.map((opt) => opt.getAttribute("value"));
    expect(fileFormatValues).toEqual(["pdf"]);
});

it("should use the hardcoded initial selections when existing in provided options", async () => {
    await createPrinting({
        dpis: [80, 96, 200, 500],
        fileFormats: ["png", "pdf"],
        pageFormats: ["a5", "a3", "a4"],
        pageOrientations: ["portrait", "landscape"]
    });

    const printingDiv: HTMLDivElement | null =
        await screen.findByTestId<HTMLDivElement>("printing");
    if (!printingDiv) {
        throw new Error("Printing not rendered");
    }

    const {
        printingSelectPageFormat,
        printingSelectOrientation,
        printingSelectDpi,
        printingSelectFileFormat
    } = await waitForPrinting();

    expect(printingSelectPageFormat.value).toEqual("a4");
    expect(printingSelectOrientation.value).toEqual("landscape");
    expect(printingSelectDpi.value).toEqual("96");
    expect(printingSelectFileFormat.value).toEqual("pdf");
});

it("should initially select the first option when hardcoded default not existing in provided options", async () => {
    await createPrinting({
        dpis: [80, 22, 200, 500],
        fileFormats: ["png"],
        pageFormats: ["a5", "a3"],
        pageOrientations: ["portrait"]
    });

    const printingDiv: HTMLDivElement | null =
        await screen.findByTestId<HTMLDivElement>("printing");
    if (!printingDiv) {
        throw new Error("Printing not rendered");
    }

    const {
        printingSelectPageFormat,
        printingSelectOrientation,
        printingSelectDpi,
        printingSelectFileFormat
    } = await waitForPrinting();

    expect(printingSelectPageFormat.value).toEqual("a5");
    expect(printingSelectOrientation.value).toEqual("portrait");
    expect(printingSelectDpi.value).toEqual("80");
    expect(printingSelectFileFormat.value).toEqual("png");
});

it("should initially select the largest fitting scale option", async () => {
    const { map, layerFactory } = await setupMap();

    vi.spyOn(map.olMap, "getSize").mockReturnValue([800, 600]);
    vi.spyOn(utils, "getViewPadding").mockReturnValue({ left: 12, right: 34, top: 56, bottom: 78 });
    // maximum print area:
    // width: 800 - 12 - 34 - 20 = 734
    // height: 600 - 56 - 78 - 20 = 446

    vi.spyOn(utils, "getScreenSizeForPageSize").mockImplementation(
        (map: MapModel, pageSize: PageSize, scale: number) => {
            if (scale === 8000) {
                return { pixelWidth: 735, pixelHeight: 447 }; // height and width too large
            } else if (scale === 6000) {
                return { pixelWidth: 735, pixelHeight: 445 }; // width too large, height within maximum
            } else if (scale === 4000) {
                return { pixelWidth: 733, pixelHeight: 447 }; // height too large, width within maximum
            } else if (scale === 2000) {
                return { pixelWidth: 733, pixelHeight: 445 }; // width and height within maximum
            } else if (scale === 1000) {
                return { pixelWidth: 733, pixelHeight: 445 }; // width and height within maximum, but not largest scale
            }
        }
    );

    await createPrinting(
        {
            // unsorted to make sure sorting order has no influence on selection
            // correct selection not as first item to ensure it's not the fallback option
            scales: [4000, 2000, 8000, 6000, 1000]
        },
        map,
        layerFactory
    );

    const printingDiv: HTMLDivElement | null =
        await screen.findByTestId<HTMLDivElement>("printing");
    if (!printingDiv) {
        throw new Error("Printing not rendered");
    }

    const { printingSelectScale } = await waitForPrinting();

    expect(printingSelectScale.value).toEqual("2000");
});

it("should use the first scale option as fallback when no fitting scale was found", async () => {
    const { map, layerFactory } = await setupMap();

    vi.spyOn(map.olMap, "getSize").mockReturnValue([800, 600]);
    vi.spyOn(utils, "getPageSize").mockReturnValue({ paperHeight: 12, paperWidth: 34 });
    vi.spyOn(utils, "getViewPadding").mockReturnValue({ left: 12, right: 34, top: 56, bottom: 78 });
    // maximum print area:
    // width: 800 - 12 - 34 - 20 = 734
    // height: 600 - 56 - 78 - 20 = 446

    vi.spyOn(utils, "getScreenSizeForPageSize").mockImplementation(
        (map: MapModel, pageSize: PageSize, scale: number) => {
            if (scale === 8000) {
                return { pixelWidth: 735, pixelHeight: 447 }; // height and width too large
            } else if (scale === 6000) {
                return { pixelWidth: 735, pixelHeight: 445 }; // width too large, height within maximum
            } else if (scale === 4000) {
                return { pixelWidth: 733, pixelHeight: 447 }; // height too large, width within maximum
            }
        }
    );

    await createPrinting(
        {
            // unsorted to make sure sorting order has no influence on selection
            // correct selection not as first item to ensure it's not the fallback option
            scales: [8000, 2000, 4000]
        },
        map,
        layerFactory
    );

    const printingDiv: HTMLDivElement | null =
        await screen.findByTestId<HTMLDivElement>("printing");
    if (!printingDiv) {
        throw new Error("Printing not rendered");
    }

    const { printingSelectScale } = await waitForPrinting();

    expect(printingSelectScale.value).toEqual("8000");
});

it("should throw an error when no scales are provided", async () => {
    await expect(() =>
        createPrinting({
            scales: []
        })
    ).rejects.toThrow("No scales defined");
});

it("should use the first scale option as fallback when map size cannot be calculated", async () => {
    const { map, layerFactory } = await setupMap();

    vi.spyOn(map.olMap, "getSize").mockReturnValue(undefined);

    await createPrinting(
        {
            scales: [40, 33, 111]
        },
        map,
        layerFactory
    );

    const printingDiv: HTMLDivElement | null =
        await screen.findByTestId<HTMLDivElement>("printing");
    if (!printingDiv) {
        throw new Error("Printing not rendered");
    }

    const { printingSelectScale } = await waitForPrinting();

    expect(printingSelectScale.value).toEqual("40");
});

it("should use the first scale option as fallback when screen size cannot be calculated", async () => {
    const { map, layerFactory } = await setupMap();

    vi.spyOn(utils, "getScreenSizeForPageSize").mockReturnValue(undefined);

    await createPrinting(
        {
            scales: [70, 44, 220]
        },
        map,
        layerFactory
    );

    const printingDiv: HTMLDivElement | null =
        await screen.findByTestId<HTMLDivElement>("printing");
    if (!printingDiv) {
        throw new Error("Printing not rendered");
    }

    const { printingSelectScale } = await waitForPrinting();

    expect(printingSelectScale.value).toEqual("70");
});

it("should throw an error when no initial selection can be found", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await createPrinting({ fileFormats: [] });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        "[ERROR] @open-pioneer/printing/Printing: No fallback option found in options. Is the list empty?",
      ]
    `);
});

it("should propagate changes of printing options to the controller", async () => {
    await createPrinting();

    const { printingSelectPageFormat, printingSelectOrientation, printingSelectScale } =
        await waitForPrinting();

    act(() => {
        fireEvent.change(printingSelectPageFormat, { target: { value: "a3" } });
    });
    expect(setPageFormatSpy.mock.lastCall![0]).toBe("a3");

    act(() => {
        fireEvent.change(printingSelectOrientation, { target: { value: "portrait" } });
    });
    expect(setOrientationSpy.mock.lastCall![0]).toBe("portrait");

    act(() => {
        fireEvent.change(printingSelectScale, { target: { value: "1000" } });
    });
    expect(setScaleSpy.mock.lastCall![0]).toBe(1000);
});

it("should propagate the provided view padding behaviour to the controller", async () => {
    await createPrinting({ viewPadding: "ignore" });

    expect(setViewPaddingSpy.mock.lastCall![0]).toBe("ignore");
});

it("should trigger the map export with the requested title and the request format", async () => {
    const user = userEvent.setup();
    await createPrinting();

    const { printingInput, printingSelectDpi, printingSelectFileFormat, printingButton } =
        await waitForPrinting();

    await user.type(printingInput, "test title");
    act(() => {
        fireEvent.change(printingSelectFileFormat, { target: { value: "pdf" } });
    });
    act(() => {
        fireEvent.change(printingSelectDpi, { target: { value: "150" } });
    });

    await user.click(printingButton);

    expect(handleMapExportSpy).toHaveBeenCalledOnce();
    expect(handleMapExportSpy.mock.lastCall![0]).toEqual({
        "fileFormat": "pdf",
        "title": "test title",
        "dpi": 150
    });
});

it("should allow triggering the map export without providing a title", async () => {
    const user = userEvent.setup();
    await createPrinting();

    const { printingSelectDpi, printingSelectFileFormat, printingButton } = await waitForPrinting();

    act(() => {
        fireEvent.change(printingSelectFileFormat, { target: { value: "png" } });
    });
    act(() => {
        fireEvent.change(printingSelectDpi, { target: { value: "300" } });
    });

    await user.click(printingButton);

    expect(handleMapExportSpy).toHaveBeenCalledOnce();
    expect(handleMapExportSpy.mock.lastCall![0]).toEqual({
        "fileFormat": "png",
        "title": "",
        "dpi": 300
    });
});

it("should indicate a running job and prevent starting more print jobs", async () => {
    const user = userEvent.setup();
    await createPrinting();

    const { printingButton } = await waitForPrinting();

    // before export
    expect(printingButton.textContent).toEqual("export");
    expect(printingButton).not.toBeDisabled();

    // start export
    await user.click(printingButton);

    // during export
    expect(printingButton.textContent).toEqual("printingMap");
    expect(printingButton).toBeDisabled();

    // finish export
    resolve(undefined);

    // reset initial state after export finished
    await vi.waitFor(() => {
        expect(handleMapExportSpy).toHaveBeenCalledOnce();
        expect(printingButton.textContent).toEqual("export");
        expect(printingButton).not.toBeDisabled();
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

    // reset initial state after export finished
    await vi.waitFor(() => {
        expect(handleMapExportSpy).toHaveBeenCalledOnce();
        expect(printingButton.textContent).toEqual("export");
        expect(printingButton).not.toBeDisabled();
    });

    // Expect message in the log
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        "[ERROR] @open-pioneer/printing/Printing: Failed to print the map",
        [Error: Error from map export],
      ]
    `);
});

async function createPrinting(props?: PrintingProps, map?: MapModel, layerFactory?: LayerFactory) {
    if (!map && !layerFactory) {
        const setup = await setupMap();
        map = setup.map;
        layerFactory = setup.layerFactory;
    }

    const notifier: Partial<NotificationService> = {
        notify: notifySpy
    };

    const injectedServices: Record<string, unknown> = {};
    injectedServices["notifier.NotificationService"] = notifier;
    injectedServices["map.LayerFactory"] = layerFactory;
    injectedServices["printing.PrintingService"] = {}; // used via useService, but never called because controller was mocked

    render(
        <PackageContextProvider services={injectedServices}>
            <Printing map={map} data-testid="printing" {...props} />
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

        const printingSelectPageFormat = printingDiv.querySelector<HTMLSelectElement>(
            ".printing-select-pageformat"
        );
        if (!printingSelectPageFormat) {
            throw new Error("Printing select page format not rendered");
        }
        const printingSelectOrientation = printingDiv.querySelector<HTMLSelectElement>(
            ".printing-select-orientation"
        );
        if (!printingSelectOrientation) {
            throw new Error("Printing select orientation not rendered");
        }
        const printingSelectScale =
            printingDiv.querySelector<HTMLSelectElement>(".printing-select-scale");
        if (!printingSelectScale) {
            throw new Error("Printing select scale not rendered");
        }
        const printingSelectDpi =
            printingDiv.querySelector<HTMLSelectElement>(".printing-select-dpi");
        if (!printingSelectDpi) {
            throw new Error("Printing select dpi not rendered");
        }
        const printingSelectFileFormat = printingDiv.querySelector<HTMLSelectElement>(
            ".printing-select-fileformat"
        );
        if (!printingSelectFileFormat) {
            throw new Error("Printing select file format not rendered");
        }

        const printingButton = getByRole(printingDiv, "button");
        return {
            printingDiv,
            printingInput,
            printingSelectPageFormat,
            printingSelectOrientation,
            printingSelectScale,
            printingSelectDpi,
            printingSelectFileFormat,
            printingButton
        };
    });
}
