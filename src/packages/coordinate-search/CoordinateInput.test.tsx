// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Coordinate } from "ol/coordinate";
import { CoordinateInput, usePlaceholder } from "./CoordinateInput";
import { get as getProjection, Projection } from "ol/proj";

it("should successfully create a coordinate input component", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <CoordinateInput mapId={mapId} data-testid="coordinate-input" />
        </PackageContextProvider>
    );

    // coordinate input is mounted
    const { coordsInputDiv } = await waitForCoordinateInput();
    expect(coordsInputDiv).toMatchSnapshot();

    // check coordinate input box is available
    expect(coordsInputDiv.tagName).toBe("DIV");
});

it("should successfully create a coordinate input component with additional css classes", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <CoordinateInput mapId={mapId} className="test" data-testid="coordinate-input" />
        </PackageContextProvider>
    );

    const { coordsInputDiv } = await waitForCoordinateInput();
    expect(coordsInputDiv.classList.contains("test")).toBe(true);
    expect(coordsInputDiv.classList.contains("foo")).toBe(false);
});

it("should successfully create a coordinate input component with external input", async () => {
    const input = [761166, 6692084];
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateInput mapId={mapId} data-testid="coordinate-input" input={input} />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();
    expect(coordInput.getAttribute("value")).toMatchInlineSnapshot('"6,838 51,398"');
});

it("should successfully create a coordinate input component with string placeholder", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateInput
                mapId={mapId}
                data-testid="coordinate-input"
                placeholder={"test placeholder"}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();
    expect(coordInput.getAttribute("placeholder")).toMatchInlineSnapshot('"test placeholder"');
});

it("should successfully create a coordinate input component with  coordinate placeholder", async () => {
    const { mapId, registry } = await setupMap();
    const coord: Coordinate = [408000, 5600000];

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateInput mapId={mapId} data-testid="coordinate-input" placeholder={coord} />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();
    expect(coordInput.getAttribute("placeholder")).toMatchInlineSnapshot('"3,665 44,863"');
});

it("should successfully create a coordinate input component with projections", async () => {
    const { mapId, registry } = await setupMap();
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
        }
    ];

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateInput
                mapId={mapId}
                data-testid="coordinate-input"
                projections={projections}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { projSelect } = await waitForCoordinateInput();
    showDropdown(projSelect);
    const options = getCurrentOptions();
    const values = getCurrentOptionValues(options);

    expect(values).toStrictEqual(["EPSG:25832", "WGS 84", "Web Mercator"]);
});

it("should format coordinates to correct coordinate string for the corresponding locale and precision", async () => {
    const coords = [6.859, 51.426];

    const renderCoords = (locale: string, precision = 2) => {
        return renderHook(
            () =>
                usePlaceholder(coords, getProjection("EPSG:4326")!, {
                    label: "EPSG:3857",
                    value: getProjection("EPSG:3857")!,
                    precision: precision
                }),
            {
                wrapper: (props) => <PackageContextProvider {...props} locale={locale} />
            }
        );
    };

    const hookEN = renderCoords("en");
    const stringCoordinates = hookEN.result.current;
    expect(stringCoordinates).equals("763,540.39 6,696,996.96");

    const hookDE = renderCoords("de", 3);
    expect(hookDE.result.current).equals("763.540,387 6.696.996,962");

    const hookDE_precision0 = renderCoords("de", 0);
    expect(hookDE_precision0.result.current).equals("763.540 6.696.997");
});

it("should update coordinates in selected option", async () => {
    const { mapId, registry } = await setupMap();
    const injectedServices = createServiceOptions({ registry });
    const initialInput = [851594.11, 6789283.95];
    const updatedInput = [860000, 6900000.95];

    function componentContent(input: number[]) {
        return (
            <PackageContextProvider services={injectedServices}>
                <MapContainer mapId={mapId} data-testid="map" />
                <CoordinateInput mapId={mapId} data-testid="coordinate-input" input={input} />
            </PackageContextProvider>
        );
    }

    const { rerender } = render(componentContent(initialInput));

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();
    expect(coordInput.getAttribute("value")).toMatchInlineSnapshot('"7.650 51.940"');

    // TODO: Remove comment
    // - Might sometimes need a waitFor() after rerender if rerendering triggers async updates (timeouts, network activity, ...)
    // - Did not verify whether coordinates in snapshot are correct
    rerender(componentContent(updatedInput));
    expect(coordInput.getAttribute("value")).toMatchInlineSnapshot(`"7.726 52.549"`);
});

it("should display transformed coordinates in selected option", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();
    const input = [851594.11, 6789283.95];

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateInput mapId={mapId} data-testid="coordinate-input" input={input} />
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

it("should successfully return the searched coordinates in the projection of the map", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    let searchedCoords: Coordinate = [];
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateInput
                mapId={mapId}
                data-testid="coordinate-input"
                onSelect={({ coords }) => {
                    searchedCoords = coords;
                }}
                onClear={() => {}}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();
    await user.type(coordInput, "7 51{enter}");
    expect(searchedCoords).toStrictEqual([779236.4355529151, 6621293.722740165]);
});

it("should successfully return the projection of the map as callback", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    let callbackProj: Projection | undefined = undefined;
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateInput
                mapId={mapId}
                data-testid="coordinate-input"
                onSelect={({ projection }) => {
                    callbackProj = projection;
                }}
                onClear={() => {}}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();
    await user.type(coordInput, "7 51{enter}");
    expect(callbackProj).toBeDefined();
    expect(callbackProj!.getCode()).toBe("EPSG:3857");
});

it("should successfully call onClear if clear button is clicked", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    let cleared: boolean = false;
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateInput
                mapId={mapId}
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

    await user.type(coordInput, "404000 5700000{enter}");
    const clearButton = getClearButton(coordinateInputGroup);
    expect(cleared).toBe(false);

    await user.click(clearButton);
    expect(cleared).toBe(true);
});

it("should successfully copy to clipboard if copy button is clicked", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();
    let copiedText = "";

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateInput
                mapId={mapId}
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
    await act(async () => await user.click(copyButton));
    expect(copiedText).toBe("3.638 89.987");
});

//TODO test tooltip messages
it("should show the correct tooltip message", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();
    const tooltipHelper = createTooltipHelper();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateInput
                mapId={mapId}
                data-testid="coordinate-input"
                onSelect={() => {}}
                onClear={() => {}}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateInput();

    await user.type(coordInput, "{backspace}{backspace}{backspace}{backspace}abc");
    const tooltip1 = await tooltipHelper.waitForChange();
    expect(tooltip1).toBe("tooltip.space");

    await user.type(coordInput, "{backspace}{backspace}{backspace}{backspace}a b c");
    const tooltip2 = await tooltipHelper.waitForChange();
    expect(tooltip2).toBe("tooltip.spaceOne");

    /*await user.type(coordInput, "{backspace}{backspace}{backspace}{backspace}{backspace}abc  abc");
    await sleep(1000);
    tooltip = await getTooltipMessage();
    expect(tooltip).toBe("tooltip.spaceOne");

    await user.type(
        coordInput,
        "{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}abc "
    );
    await sleep(1000);
    tooltip = await getTooltipMessage();
    expect(tooltip).toBe("tooltip.2coords");

    await user.type(
        coordInput,
        "{backspace}{backspace}{backspace}{backspace}{backspace}abc.abc abc.def"
    );
    await sleep(1000);
    tooltip = await getTooltipMessage();
    expect(tooltip).toBe("tooltip.dividerDe");

    await user.type(
        coordInput,
        "{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}abc,abc abc,def"
    );
    await sleep(1000);
    tooltip = await getTooltipMessage();
    expect(tooltip).toBe("tooltip.dividerEn");

    await user.type(
        coordInput,
        "{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}123.123 123.123"
    );
    await sleep(1000);
    tooltip = await getTooltipMessage();
    expect(tooltip).toBe("tooltip.dividerDe");

    await user.type(
        coordInput,
        "{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}123,123 123,123"
    );
    await sleep(1000);
    tooltip = await getTooltipMessage();
    expect(tooltip).toBe("tooltip.dividerEn");

    await user.type(
        coordInput,
        "{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}0 0"
    );
    await sleep(1000);
    tooltip = await getTooltipMessage();
    expect(tooltip).toBe("tooltip.extent");*/
});

it("should show copy button on coordinate placeholder", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateInput
                mapId={mapId}
                data-testid="coordinate-input"
                placeholder={[405000, 58000000]}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordinateInputGroup } = await waitForCoordinateInput();
    const copyButton = getCopyButton(coordinateInputGroup);
    expect(copyButton).toBeDefined();
    expect(() => getClearButton(coordinateInputGroup)).toThrowError(
        /^coordinate input clear button not rendered$/
    );
});

it("should show clear button on coordinate placeholder", async () => {
    const { mapId, registry } = await setupMap();
    const user = userEvent.setup();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateInput
                mapId={mapId}
                data-testid="coordinate-input"
                onSelect={() => {}}
                onClear={() => {}}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput, coordinateInputGroup } = await waitForCoordinateInput();

    await user.type(coordInput, "404000 5700000{enter}");

    const clearButton = getClearButton(coordinateInputGroup);
    expect(clearButton).toBeDefined();
    expect(() => getCopyButton(coordinateInputGroup)).toThrowError(
        /^coordinate input copy button not rendered$/
    );
});

async function waitForCoordinateInput() {
    const { coordsInputDiv, coordInput, coordinateInputGroup, projSelect } = await waitFor(
        async () => {
            const coordsInputDiv = await screen.findByTestId("coordinate-input");

            const coordinateInputGroup = coordsInputDiv.querySelector(".coordinateInputGroup");
            if (!coordinateInputGroup) {
                throw new Error("coordinate input group not rendered");
            }

            const coordInputDiv = coordinateInputGroup.querySelector(".coordinateInputFieldGroup");
            if (!coordInputDiv) {
                throw new Error("coordinate input field  group not rendered");
            }

            const coordInput = coordInputDiv.querySelector(".chakra-input");
            if (!coordInput) {
                throw new Error("coordinate input field not rendered");
            }

            const projSelect: HTMLElement | null = coordinateInputGroup.querySelector(
                ".coordinate-Input-Select--has-value"
            );
            if (!projSelect) {
                throw new Error("coordinate input projection select not rendered");
            }

            return { coordsInputDiv, coordInput, coordinateInputGroup, projSelect };
        }
    );

    return { coordsInputDiv, coordInput, coordinateInputGroup, projSelect };
}

function showDropdown(projSelect: HTMLElement) {
    // open dropdown to include options in snapshot; react-select creates list of options in dom after opening selection
    act(() => {
        fireEvent.keyDown(projSelect, { key: "ArrowDown" });
    });
}

function getCurrentOptions() {
    return Array.from(
        document.getElementsByClassName("coordinate-Input-Select__option")
    ) as HTMLElement[];
}

function getCurrentOptionValues(options: HTMLElement[]) {
    const values: (string | null)[] = [];
    for (const opt of options) {
        values.push(opt.textContent);
    }
    return values;
}

function getClearButton(coordinateInputGroup: Element) {
    const buttonDiv = coordinateInputGroup.querySelector(".chakra-input__right-element");
    if (!buttonDiv) {
        throw new Error("coordinate input buttons not rendered");
    }
    const clearButton = buttonDiv.querySelector(".clearButton");
    if (!clearButton) {
        throw new Error("coordinate input clear button not rendered");
    }
    return clearButton;
}

function getCopyButton(coordinateInputGroup: Element) {
    const buttonDiv = coordinateInputGroup.querySelector(".chakra-input__right-element");
    if (!buttonDiv) {
        throw new Error("coordinate input buttons not rendered");
    }
    const copyButton = buttonDiv.querySelector(".copyButton");
    if (!copyButton) {
        throw new Error("coordinate input copy button not rendered");
    }
    return copyButton;
}

// Returns undefined if no unique tooltip was found
function getCurrentTooltipText(): string | undefined {
    const tooltips = document.getElementsByClassName("coordinateInputToolTip");
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

async function getTooltipMessage() {
    const tooltipDiv = await waitFor(async () => {
        const tooltips = document.getElementsByClassName("coordinateInputToolTip");
        if (!tooltips.length) {
            throw new Error("No tooltip found");
        }
        if (tooltips.length > 1) {
            throw new Error("More than one tooltip found");
        }
        return tooltips[0] as HTMLElement;
    });
    return tooltipDiv.textContent;
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}
