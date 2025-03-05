// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { nextTick } from "@conterra/reactivity-core";
import { MapContainer } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Coordinate } from "ol/coordinate";
import { Projection } from "ol/proj";
import { disableReactActWarnings } from "test-utils";
import { beforeEach, expect, it, vi } from "vitest";
import { CoordinateInput } from "./CoordinateInput";
import {
    getClearButton,
    getCopyButton,
    getCurrentOptions,
    getCurrentOptionValues,
    showDropdown
} from "./test-utils";
import { NumberParserService } from "@open-pioneer/runtime";
import { NumberParser } from "@open-pioneer/core";

beforeEach(() => {
    disableReactActWarnings();
});

it("should successfully create a coordinate input component", async () => {
    const { map, injectedServices } = await setUp();
    render(
        <PackageContextProvider services={injectedServices}>
            <CoordinateInput map={map} data-testid="coordinate-input" />
        </PackageContextProvider>
    );

    // coordinate input is mounted
    const { coordsInputDiv } = await waitForCoordinateInput();
    expect(coordsInputDiv).toMatchSnapshot();

    // check coordinate input box is available
    expect(coordsInputDiv.tagName).toBe("DIV");
});

it("should successfully create a coordinate input component with additional css classes", async () => {
    const { map, injectedServices } = await setUp();

    render(
        <PackageContextProvider services={injectedServices}>
            <CoordinateInput map={map} className="test" data-testid="coordinate-input" />
        </PackageContextProvider>
    );

    const { coordsInputDiv } = await waitForCoordinateInput();
    expect(coordsInputDiv.classList.contains("test")).toBe(true);
    expect(coordsInputDiv.classList.contains("foo")).toBe(false);
});

it("should successfully create a coordinate input component with external input", async () => {
    const input = [761166, 6692084];
    const { map, injectedServices } = await setUp();

    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <MapContainer map={map} data-testid="map" />
            <CoordinateInput map={map} data-testid="coordinate-input" input={input} />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();
    expect(coordInput.getAttribute("value")).toMatchInlineSnapshot('"6,838 51,398"');
});

it("should successfully create a coordinate input component with string placeholder", async () => {
    const { map, injectedServices } = await setUp();

    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <MapContainer map={map} data-testid="map" />
            <CoordinateInput
                map={map}
                data-testid="coordinate-input"
                placeholder={"test placeholder"}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();
    expect(coordInput.getAttribute("placeholder")).toMatchInlineSnapshot('"test placeholder"');
});

it("should successfully create a coordinate input component without a string placeholder", async () => {
    const { map, injectedServices } = await setUp();

    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <MapContainer map={map} data-testid="map" />
            <CoordinateInput map={map} data-testid="coordinate-input" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();
    expect(coordInput.getAttribute("placeholder")).toMatchInlineSnapshot('""');
});

it("should successfully create a coordinate input component with coordinate placeholder", async () => {
    const coord: Coordinate = [408000, 5600000];

    const { map, injectedServices } = await setUp();
    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <MapContainer map={map} data-testid="map" />
            <CoordinateInput map={map} data-testid="coordinate-input" placeholder={coord} />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();
    expect(coordInput.getAttribute("placeholder")).toMatchInlineSnapshot('"3,665 44,863"');
});

it("should successfully create a coordinate input component with known projections", async () => {
    const { map, injectedServices } = await setUp();
    const projections = [
        {
            label: "EPSG:25832",
            value: "EPSG:25832"
        },
        {
            label: "WGS 84",
            value: "EPSG:4326"
        },
        {
            label: "Web Mercator",
            value: "EPSG:3857"
        },
        {
            label: "Unknown to ignore",
            value: "EPSG:99999"
        }
    ];

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="map" />
            <CoordinateInput map={map} data-testid="coordinate-input" projections={projections} />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { projSelect } = await waitForCoordinateInput();
    showDropdown(projSelect);
    const options = getCurrentOptions();
    const values = getCurrentOptionValues(options);

    expect(values).toStrictEqual(["EPSG:25832", "WGS 84", "Web Mercator"]);
});

it("should successfully create a coordinate input component with default projections", async () => {
    const { map, injectedServices } = await setUp();

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="map" />
            <CoordinateInput map={map} data-testid="coordinate-input" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { projSelect } = await waitForCoordinateInput();
    showDropdown(projSelect);
    const options = getCurrentOptions();
    const values = getCurrentOptionValues(options);

    expect(values).toStrictEqual(["WGS 84", "Web Mercator"]);
});

it("should update coordinates in selected option", async () => {
    const { map, injectedServices } = await setUp();
    const initialInput = [851594.11, 6789283.95];
    const updatedInput = [860000, 6900000.95];

    function componentContent(input: number[]) {
        return (
            <PackageContextProvider services={injectedServices}>
                <MapContainer map={map} data-testid="map" />
                <CoordinateInput map={map} data-testid="coordinate-input" input={input} />
            </PackageContextProvider>
        );
    }

    const { rerender } = render(componentContent(initialInput));

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();
    expect(coordInput.getAttribute("value")).toMatchInlineSnapshot('"7.650 51.940"');

    rerender(componentContent(updatedInput));
    await nextTick(); // slightly delayed by useReactiveSnapshot()
    expect(coordInput.getAttribute("value")).toMatchInlineSnapshot(`"7.726 52.549"`);
});

it("should display transformed coordinates in selected option", async () => {
    const user = userEvent.setup();
    const input = [851594.11, 6789283.95];
    const { map, injectedServices } = await setUp();

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="map" />
            <CoordinateInput map={map} data-testid="coordinate-input" input={input} />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput, projSelect } = await waitForCoordinateInput();
    showDropdown(projSelect);

    let options = getCurrentOptions();
    const option4326 = options.find((option) => option.textContent === "WGS 84");
    if (!option4326) {
        throw new Error("EPSG 4326 missing in options");
    }
    await user.click(option4326);

    expect(coordInput.getAttribute("value")).toMatchInlineSnapshot('"7.650 51.940"'); //should display EPSG 4326

    showDropdown(projSelect);
    options = getCurrentOptions();
    const option3857 = options.find((option) => option.textContent === "Web Mercator");
    if (!option3857) {
        throw new Error("EPSG 3857 missing in options");
    }
    await user.click(option3857);
    expect(coordInput.getAttribute("value")).toMatchInlineSnapshot('"851,594.11 6,789,283.95"'); //should display EPSG 3857
});

it(
    "should successfully call onSelect after entering a new input",
    {
        timeout: 10000
    },
    async () => {
        const user = userEvent.setup();
        const { map, injectedServices } = await setUp();

        let searchedCoords: Coordinate = [];
        let callbackProj: Projection | undefined = undefined;
        render(
            <PackageContextProvider services={injectedServices}>
                <MapContainer map={map} data-testid="map" />
                <CoordinateInput
                    map={map}
                    data-testid="coordinate-input"
                    onSelect={({ coords, projection }) => {
                        searchedCoords = coords;
                        callbackProj = projection;
                    }}
                    onClear={() => {}}
                />
            </PackageContextProvider>
        );

        await waitForMapMount("map");
        const { coordInput } = await waitForCoordinateInput();
        await user.type(coordInput, "7 51");
        await user.type(coordInput, "{enter}");
        expect(searchedCoords).toStrictEqual([779236.4355529151, 6621293.722740165]);
        expect(callbackProj).toBeDefined();
        expect(callbackProj!.getCode()).toBe("EPSG:3857");
    }
);

it(
    "should not call onSelect after entering an invalid input",
    {
        timeout: 10000
    },
    async () => {
        const user = userEvent.setup();
        const { map, injectedServices } = await setUp();

        let callbackProj: Projection | undefined = undefined;
        let searchedCoords: Coordinate = [];
        let called = false;
        render(
            <PackageContextProvider services={injectedServices}>
                <MapContainer map={map} data-testid="map" />
                <CoordinateInput
                    map={map}
                    data-testid="coordinate-input"
                    onSelect={({ coords, projection }) => {
                        searchedCoords = coords;
                        callbackProj = projection;
                        called = true;
                    }}
                    onClear={() => {}}
                />
            </PackageContextProvider>
        );

        await waitForMapMount("map");
        const { coordInput } = await waitForCoordinateInput();
        await user.type(coordInput, "a b{enter}");
        expect(searchedCoords).toStrictEqual([]);
        expect(callbackProj).toBeUndefined();
        expect(called).toBeFalsy();
    }
);

it(
    "should successfully call onClear if clear button is clicked",
    {
        timeout: 10000
    },
    async () => {
        const user = userEvent.setup();
        const { map, injectedServices } = await setUp();

        let cleared: boolean = false;
        render(
            <PackageContextProvider services={injectedServices}>
                <MapContainer map={map} data-testid="map" />
                <CoordinateInput
                    map={map}
                    data-testid="coordinate-input"
                    onSelect={() => {}}
                    onClear={() => {
                        cleared = true;
                    }}
                />
            </PackageContextProvider>
        );

        await waitForMapMount("map");
        const { coordInput, coordinateInputGroup } = await waitForCoordinateInput();

        await user.type(coordInput, "4 5{enter}");
        const clearButton = getClearButton(coordinateInputGroup);
        expect(coordInput.getAttribute("value")).toMatchInlineSnapshot('"4 5"');
        expect(cleared).toBe(false);

        await user.click(clearButton);
        expect(coordInput.getAttribute("value")).toMatchInlineSnapshot('""');
        expect(cleared).toBe(true);
    }
);

it("should successfully copy to clipboard if copy button is clicked", async () => {
    const user = userEvent.setup();
    const { map, injectedServices } = await setUp();
    let copiedText = "";

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="map" />
            <CoordinateInput
                map={map}
                data-testid="coordinate-input"
                placeholder={[405000, 58000000]}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordinateInputGroup } = await waitForCoordinateInput();

    vi.spyOn(navigator, "clipboard", "get").mockReturnValue({
        writeText(input: string) {
            copiedText = input;
            return new Promise<void>((resolve) => resolve());
        },
        readText(): Promise<string> {
            return new Promise<string>((resolve) => resolve(""));
        },
        write(): Promise<void> {
            return new Promise<void>((resolve) => resolve());
        },
        addEventListener(): void {},
        dispatchEvent(): boolean {
            return false;
        },
        removeEventListener(): void {},
        read(): Promise<ClipboardItems> {
            return new Promise<ClipboardItems>((resolve) => resolve([]));
        }
    });
    const copyButton = getCopyButton(coordinateInputGroup);
    await user.click(copyButton);
    expect(copiedText).toBe("3.638 89.987");
});

it(
    "should validate the input and show the correct tooltip message",
    { timeout: 10000 },
    async () => {
        const user = userEvent.setup();
        const tooltipHelper = createTooltipHelper();
        const { map, injectedServices } = await setUp("de");

        render(
            <PackageContextProvider services={injectedServices} locale="de">
                <MapContainer map={map} data-testid="map" />
                <CoordinateInput
                    map={map}
                    data-testid="coordinate-input"
                    onSelect={() => {}}
                    onClear={() => {}}
                />
            </PackageContextProvider>
        );

        await waitForMapMount("map");
        const { coordInput } = await waitForCoordinateInput();

        await user.clear(coordInput);
        await user.click(coordInput);
        await user.paste("ab");
        const tooltip1 = await tooltipHelper.waitForChange();
        expect(tooltip1).toBe("tooltip.space");

        await user.clear(coordInput);
        await user.click(coordInput);
        await user.paste("a  a");
        const tooltip2 = await tooltipHelper.waitForChange();
        expect(tooltip2).toBe("tooltip.spaceOne");

        await user.clear(coordInput);
        await user.click(coordInput);
        await user.paste("a ");
        const tooltip3 = await tooltipHelper.waitForChange();
        expect(tooltip3).toBe("tooltip.2coords");

        await user.clear(coordInput);
        await user.click(coordInput);
        await user.paste("a,b c,d");
        const tooltip4 = await tooltipHelper.waitForChange();
        expect(tooltip4).toBe("tooltip.invalidNumbers");

        await user.clear(coordInput);
        await user.click(coordInput);
        await user.paste("a b c");
        const tooltip5 = await tooltipHelper.waitForChange();
        expect(tooltip5).toBe("tooltip.spaceOne");

        await user.clear(coordInput);
        await user.click(coordInput);
        await user.paste("a b");
        const tooltip6 = await tooltipHelper.waitForChange();
        expect(tooltip6).toBe("tooltip.invalidNumbers");
    }
);

it("should validate if the user input is within the extent of the selected projection", async () => {
    const user = userEvent.setup();
    const tooltipHelper = createTooltipHelper();
    const { map, injectedServices } = await setUp();

    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <MapContainer map={map} data-testid="map" />
            <CoordinateInput
                map={map}
                data-testid="coordinate-input"
                onSelect={() => {}}
                onClear={() => {}}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();

    await user.clear(coordInput);
    await user.click(coordInput);
    await user.paste("200 100");
    const tooltip8 = await tooltipHelper.waitForChange();
    expect(tooltip8).toBe("tooltip.extent");
});

it("should validate input property is within the extent of the selected projection", async () => {
    const user = userEvent.setup();
    const { map, injectedServices } = await setUp();

    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <MapContainer map={map} data-testid="map" />
            <CoordinateInput
                map={map}
                data-testid="coordinate-input"
                onSelect={() => {}}
                onClear={() => {}}
                input={[3495814159, 56963568019]}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();
    await user.click(coordInput);
    const tooltip = getCurrentTooltipText();
    expect(tooltip).toBe("tooltip.extent");
});

it("should not show copy button on string placeholder", async () => {
    const { map, injectedServices } = await setUp();

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="map" />
            <CoordinateInput map={map} data-testid="coordinate-input" placeholder={"test"} />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordinateInputGroup } = await waitForCoordinateInput();
    expect(() => getCopyButton(coordinateInputGroup)).toThrowError(/^buttons not rendered$/);
    expect(() => getClearButton(coordinateInputGroup)).toThrowError(/^buttons not rendered$/);
});

it("should show copy button on coordinate placeholder", async () => {
    const { map, injectedServices } = await setUp();

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="map" />
            <CoordinateInput
                map={map}
                data-testid="coordinate-input"
                placeholder={[405000, 58000000]}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordinateInputGroup } = await waitForCoordinateInput();
    const copyButton = getCopyButton(coordinateInputGroup);
    expect(copyButton).toBeDefined();
    expect(() => getClearButton(coordinateInputGroup)).toThrowError(/^clear button not rendered$/);
});

it("should show clear button on coordinate placeholder", async () => {
    const user = userEvent.setup();
    const { map, injectedServices } = await setUp();

    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="map" />
            <CoordinateInput
                map={map}
                data-testid="coordinate-input"
                onSelect={() => {}}
                onClear={() => {}}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput, coordinateInputGroup } = await waitForCoordinateInput();

    await user.type(coordInput, "4 5{enter}");

    const clearButton = getClearButton(coordinateInputGroup);
    expect(clearButton).toBeDefined();
    expect(() => getCopyButton(coordinateInputGroup)).toThrowError(/^copy button not rendered$/);
});

async function waitForCoordinateInput() {
    const { coordsInputDiv, coordInput, coordinateInputGroup, projSelect } = await waitFor(
        async () => {
            const coordsInputDiv = await screen.findByTestId("coordinate-input");

            const coordinateInputGroup = coordsInputDiv.querySelector(".coordinate-input-group");
            if (!coordinateInputGroup) {
                throw new Error("coordinate input group not rendered");
            }

            const coordInputDiv = coordinateInputGroup.querySelector(
                ".coordinate-input-field-group"
            );
            if (!coordInputDiv) {
                throw new Error("coordinate input field  group not rendered");
            }

            const coordInput = coordInputDiv.querySelector(".chakra-input");
            if (!coordInput) {
                throw new Error("coordinate input field not rendered");
            }

            const projSelect: HTMLElement | null = coordinateInputGroup.querySelector(
                ".coordinate-input-select--has-value"
            );
            if (!projSelect) {
                throw new Error("coordinate input projection select not rendered");
            }

            return { coordsInputDiv, coordInput, coordinateInputGroup, projSelect };
        }
    );

    return { coordsInputDiv, coordInput, coordinateInputGroup, projSelect };
}

// Returns undefined if no unique tooltip was found
function getCurrentTooltipText(): string | undefined {
    const tooltips = document.getElementsByClassName("coordinate-input-tooltip");
    if (!tooltips.length || tooltips.length > 1) {
        return undefined;
    }
    return (tooltips[0] as HTMLElement).textContent ?? undefined;
}

function createTooltipHelper() {
    let currentTooltip = getCurrentTooltipText();
    return {
        /** Waits until the tooltip has a different content (including undefined) from the last time it was checked. */
        async waitForChange() {
            const newTooltip = await waitFor(() => {
                const newTooltip = getCurrentTooltipText();
                if (newTooltip === currentTooltip) {
                    throw new Error(`Tooltip has not changed, still '${currentTooltip}'`);
                }
                return newTooltip;
            });
            currentTooltip = newTooltip;
            return newTooltip;
        },
        currentTooltip() {
            return currentTooltip;
        }
    };
}

async function setUp(locale: string = "en") {
    const { map, registry } = await setupMap();
    const numberParser = new NumberParser(locale);
    const numberParserService = {
        parseNumber: (number) => {
            return numberParser.parse(number);
        }
    } satisfies Partial<NumberParserService>;

    const injectedServices = {
        ...createServiceOptions({ registry }),
        "runtime.NumberParserService": numberParserService
    };

    return { map, injectedServices };
}
