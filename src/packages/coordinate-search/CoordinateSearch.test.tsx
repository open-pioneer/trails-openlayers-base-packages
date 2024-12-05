// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { Coordinate } from "ol/coordinate";
import BaseEvent from "ol/events/Event";
import { expect, it, vi } from "vitest";
import { CoordinateSearch } from "./CoordinateSearch";
import {
    getClearButton,
    getCopyButton,
    getCurrentOptions,
    getCurrentOptionValues,
    showDropdown
} from "./test-utils";

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
            <CoordinateSearch mapId={mapId} className="test" data-testid="coordinate-search" />
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
            <CoordinateSearch mapId={mapId} data-testid="coordinate-search" />
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
            <CoordinateSearch mapId={mapId} data-testid="coordinate-search" />
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

it(
    "should successfully call onSelect and return coordinates and projection",
    {
        timeout: 10000
    },
    async () => {
        const user = userEvent.setup();
        const { mapId, registry } = await setupMap();

        const injectedServices = createServiceOptions({ registry });
        let searchedCoords: Coordinate = [];
        let callbackProj;
        render(
            <PackageContextProvider services={injectedServices}>
                <MapContainer mapId={mapId} data-testid="map" />
                <CoordinateSearch
                    mapId={mapId}
                    data-testid="coordinate-search"
                    onSelect={({ coords, projection }) => {
                        searchedCoords = coords;
                        callbackProj = projection;
                    }}
                />
            </PackageContextProvider>
        );

        await waitForMapMount("map");
        const { coordInput } = await waitForCoordinateSearch();
        await user.type(coordInput, "7 51{enter}");
        expect(searchedCoords).toStrictEqual([779236.4355529151, 6621293.722740165]);
        expect(callbackProj).toBeDefined();
        expect(callbackProj!.getCode()).toBe("EPSG:3857");
    }
);

it(
    "should set the map center to the entered coordinate",
    {
        timeout: 10000
    },
    async () => {
        const user = userEvent.setup();
        const { mapId, registry } = await setupMap();
        const map = (await registry.expectMapModel(mapId))?.olMap;

        const injectedServices = createServiceOptions({ registry });
        render(
            <PackageContextProvider services={injectedServices}>
                <MapContainer mapId={mapId} data-testid="map" />
                <CoordinateSearch mapId={mapId} data-testid="coordinate-search" />
            </PackageContextProvider>
        );

        await waitForMapMount("map");
        const { coordInput, coordinateInputGroup } = await waitForCoordinateSearch();

        await input(user, coordInput, "7 51");
        let clearButton = getClearButton(coordinateInputGroup);
        const firstCenter = map.getView().getCenter();
        expect(firstCenter).toEqual([779236.4355529151, 6621293.722740165]);

        await user.click(clearButton);
        await input(user, coordInput, "6 51");
        const secondCenter = map.getView().getCenter();
        expect(secondCenter).toEqual([667916.9447596414, 6621293.722740165]);

        clearButton = getClearButton(coordinateInputGroup);
        await user.click(clearButton);
        await input(user, coordInput, "6b 51"); // wrong input
        const thirdCenter = map.getView().getCenter();
        expect(thirdCenter).toEqual(secondCenter); // map unchanged
    }
);

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
            <CoordinateSearch mapId={mapId} data-testid="coordinate-search" />
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
    await user.click(copyButton);
    expect(copiedText).toBe("7.636 51.999");
});

async function waitForCoordinateSearch() {
    const { coordsSearchDiv, coordInput, coordinateInputGroup, projSelect } = await waitFor(
        async () => {
            const coordsSearchDiv = await screen.findByTestId("coordinate-search");

            const coordinateInputGroup = coordsSearchDiv.querySelector(".coordinate-input-group");
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

            return { coordsSearchDiv, coordInput, coordinateInputGroup, projSelect };
        }
    );

    return { coordsSearchDiv, coordInput, coordinateInputGroup, projSelect };
}

// A bit faster than typing letters individually with `keyboard`
async function input(user: UserEvent, element: Element, value: string) {
    await user.click(element);
    await user.paste(value);
    await user.keyboard("{Enter}");
}
