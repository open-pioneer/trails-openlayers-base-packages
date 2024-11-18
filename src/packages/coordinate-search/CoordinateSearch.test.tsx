// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import BaseEvent from "ol/events/Event";
import { expect, it, vi } from "vitest";
import { CoordinateSearch } from "./CoordinateSearch";
import userEvent from "@testing-library/user-event";
import { Coordinate } from "ol/coordinate";

it("should successfully create a coordinate search component", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <CoordinateSearch mapId={mapId} data-testid="coordinate-search" />
        </PackageContextProvider>
    );

    // coordinate search is mounted
    const { coordsSearchDiv } = await waitForCoordinateSearch();
    expect(coordsSearchDiv).toMatchSnapshot();

    // check coordinate search box is available
    expect(coordsSearchDiv.tagName).toBe("DIV");
});

it("should successfully create a coordinate search component with additional css classes", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <CoordinateSearch
                mapId={mapId}
                className="test"
                data-testid="coordinate-search"
                onSelect={() => {}}
                onClear={() => {}}
            />
        </PackageContextProvider>
    );

    const { coordsSearchDiv } = await waitForCoordinateSearch();
    expect(coordsSearchDiv.classList.contains("test")).toBe(true);
    expect(coordsSearchDiv.classList.contains("foo")).toBe(false);
});

it("should successfully create a coordinate search component with projections", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <CoordinateSearch
                mapId={mapId}
                data-testid="coordinate-search"
                projections={[
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
                ]}
            />
        </PackageContextProvider>
    );

    const { projSelect } = await waitForCoordinateSearch();
    showDropdown(projSelect);
    const options = getCurrentOptions();
    const values = getCurrentOptionValues(options);

    expect(values).toStrictEqual(["EPSG:25832", "WGS 84", "Web Mercator"]);
});

it("tracks the user's mouse position", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateSearch
                mapId={mapId}
                data-testid="coordinate-search"
                onSelect={() => {}}
                onClear={() => {}}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateSearch();
    expect(coordInput.getAttribute("placeholder")).toMatchInlineSnapshot('""');

    const map = await registry.expectMapModel(mapId);

    const simulateMove = (x: number, y: number) => {
        const fakeMoveEvent = new BaseEvent("pointermove");
        (fakeMoveEvent as any).coordinate = [x, y];
        map.olMap.dispatchEvent(fakeMoveEvent);
    };

    // Simple move
    act(() => {
        simulateMove(777000, 6698400);
    });
    expect(coordInput.getAttribute("placeholder")).toMatchInlineSnapshot('"6,980 51,434"');

    // Another move + projection change
    act(() => {
        simulateMove(754602, 6664688);
    });
    expect(coordInput.getAttribute("placeholder")).toMatchInlineSnapshot('"6,779 51,245"');
});

it("should display transformed coordinates in selected option", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateSearch
                mapId={mapId}
                data-testid="coordinate-search"
                onSelect={() => {}}
                onClear={() => {}}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput, projSelect } = await waitForCoordinateSearch();
    showDropdown(projSelect);

    const map = await registry.expectMapModel(mapId);

    const simulateMove = (x: number, y: number) => {
        const fakeMoveEvent = new BaseEvent("pointermove");
        (fakeMoveEvent as any).coordinate = [x, y];
        map.olMap.dispatchEvent(fakeMoveEvent);
    };

    let options = getCurrentOptions();
    const option4326 = options.find((option) => option.textContent === "WGS 84");
    if (!option4326) {
        throw new Error("EPSG 4326 missing in options");
    }
    await user.click(option4326);

    // Simple move
    act(() => {
        simulateMove(851594.11, 6789283.95); //map projection is EPSG:3857 (Web Mercator)
    });
    expect(coordInput.getAttribute("placeholder")).toMatchInlineSnapshot('"7.650 51.940"'); //should display EPSG 4326

    showDropdown(projSelect);
    options = getCurrentOptions();
    const option3857 = options.find((option) => option.textContent === "Web Mercator");
    if (!option3857) {
        throw new Error("EPSG 3857 missing in options");
    }
    await user.click(option3857);

    // Simple move
    act(() => {
        simulateMove(851594.11, 6789283.95); //map projection is EPSG:3857 (Web Mercator)
    });
    expect(coordInput.getAttribute("placeholder")).toMatchInlineSnapshot(
        '"851,594.11 6,789,283.95"'
    ); //should display EPSG 3857
});

it("should successfully return the search coordinates in the projection of the map", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    let searchedCoords: Coordinate = [];
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateSearch
                mapId={mapId}
                data-testid="coordinate-search"
                onSelect={({ coords }) => {
                    searchedCoords = coords;
                }}
                onClear={() => {}}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateSearch();
    await user.type(coordInput, "7 51{enter}");
    expect(searchedCoords).toStrictEqual([779236.4355529151, 6621293.722740165]);
});

it("should successfully return the projection of the map as callback", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    let callbackProj;
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
            <CoordinateSearch
                mapId={mapId}
                data-testid="coordinate-search"
                onSelect={({ projection }) => {
                    callbackProj = projection;
                }}
                onClear={() => {}}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateSearch();
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
            <CoordinateSearch
                mapId={mapId}
                data-testid="coordinate-search"
                onSelect={() => {}}
                onClear={() => {
                    cleared = true;
                }}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput, coordinateInputGroup } = await waitForCoordinateSearch();

    await user.type(coordInput, "4 5{enter}");
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
            <CoordinateSearch
                mapId={mapId}
                data-testid="coordinate-search"
                onSelect={() => {}}
                onClear={() => {}}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordinateInputGroup } = await waitForCoordinateSearch();

    const map = await registry.expectMapModel(mapId);

    const simulateMove = (x: number, y: number) => {
        const fakeMoveEvent = new BaseEvent("pointermove");
        (fakeMoveEvent as any).coordinate = [x, y];
        map.olMap.dispatchEvent(fakeMoveEvent);
    };

    // Simple move
    act(() => {
        simulateMove(850000, 6800000); //map projection is EPSG:3857 (Web Mercator)
    });
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
    expect(copiedText).toBe("7.636 51.999");
});

async function waitForCoordinateSearch() {
    const { coordsSearchDiv, coordInput, coordinateInputGroup, projSelect } = await waitFor(
        async () => {
            const coordsSearchDiv = await screen.findByTestId("coordinate-search");

            const coordinateInputGroup = coordsSearchDiv.querySelector(".coordinateInputGroup");
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

            return { coordsSearchDiv, coordInput, coordinateInputGroup, projSelect };
        }
    );

    return { coordsSearchDiv, coordInput, coordinateInputGroup, projSelect };
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

function getClearButton(coordinateSearchGroup: Element) {
    const buttonDiv = coordinateSearchGroup.querySelector(".chakra-input__right-element");
    if (!buttonDiv) {
        throw new Error("coordinate search buttons not rendered");
    }
    const clearButton = buttonDiv.querySelector(".clearButton");
    if (!clearButton) {
        throw new Error("coordinate search clear button not rendered");
    }
    return clearButton;
}

function getCopyButton(coordinateSearchGroup: Element) {
    const buttonDiv = coordinateSearchGroup.querySelector(".chakra-input__right-element");
    if (!buttonDiv) {
        throw new Error("coordinate search buttons not rendered");
    }
    const copyButton = buttonDiv.querySelector(".copyButton");
    if (!copyButton) {
        throw new Error("coordinate search copy button not rendered");
    }
    return copyButton;
}
