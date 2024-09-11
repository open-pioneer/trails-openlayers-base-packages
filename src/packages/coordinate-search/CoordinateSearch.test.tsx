// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import BaseEvent from "ol/events/Event";
import { expect, it } from "vitest";
import { CoordinateSearch, useCoordinatesString } from "./CoordinateSearch";
import userEvent from "@testing-library/user-event";
import { Coordinate } from "ol/coordinate";

it("should successfully create a coordinate search component", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <CoordinateSearch
                mapId={mapId}
                data-testid="coordinate-search"
                onSelect={() => {}}
                onClear={() => {}}
            />
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
it("should format coordinates to correct coordinate string for the corresponding locale and precision", async () => {
    const coords = [3545.08081, 4543543.009];

    const renderCoords = (locale: string, precision = 2) => {
        return renderHook(() => useCoordinatesString(coords, precision), {
            wrapper: (props) => <PackageContextProvider {...props} locale={locale} />
        });
    };

    const hookEN = renderCoords("en");
    const stringCoordinates = hookEN.result.current;
    expect(stringCoordinates).equals("3,545.08 4,543,543.01");

    const hookDE = renderCoords("de", 3);
    expect(hookDE.result.current).equals("3.545,081 4.543.543,009");

    const hookDE_precision0 = renderCoords("de", 0);
    expect(hookDE_precision0.result.current).equals("3.545 4.543.543");
});

it("should format coordinates to correct coordinate string with default precision", async () => {
    const coords = [3545.08081, 4543543.009];
    const hookDeWithoutPrecision = renderHook(() => useCoordinatesString(coords, undefined), {
        wrapper: (props) => <PackageContextProvider {...props} locale="de" />
    });
    expect(hookDeWithoutPrecision.result.current).equals("3.545,081 4.543.543,009");
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

    let options = getCurrentOptions(projSelect);
    const option4326 = options.find((option) => option.textContent === "EPSG:4326");
    if (!option4326) {
        throw new Error("EPSG 4326 missing in options");
    }
    await act(async () => {
        await user.click(option4326);
    });

    // Simple move
    act(() => {
        simulateMove(851594.11, 6789283.95); //map projection is EPSG:3857 (Web Mercator)
    });
    expect(coordInput.getAttribute("placeholder")).toMatchInlineSnapshot('"7.650 51.940"'); //should display EPSG 4326

    showDropdown(projSelect);
    options = getCurrentOptions(projSelect);
    const option3857 = options.find((option) => option.textContent === "EPSG:3857");
    if (!option3857) {
        throw new Error("EPSG 3857 missing in options");
    }
    await act(async () => {
        await user.click(option3857);
    });

    // Simple move
    act(() => {
        simulateMove(851594.11, 6789283.95); //map projection is EPSG:3857 (Web Mercator)
    });
    expect(coordInput.getAttribute("placeholder")).toMatchInlineSnapshot(
        '"851,594.110 6,789,283.950"'
    ); //should display EPSG 3857
});

it("should successfully give back the search coordinates in the projection of the map", async () => {
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
                    console.log(coords);
                    searchedCoords = coords;
                }}
                onClear={() => {}}
            />
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { coordInput } = await waitForCoordinateSearch();
    await act(async () => {
        await user.type(coordInput, "7 51{enter}");
    });
    expect(searchedCoords).toStrictEqual([779236.4355529151, 6621293.722740165]);
});

it("should successfully give back the projection of the map as callback", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    let callbackProj: string = "";
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
    await act(async () => {
        await user.type(coordInput, "7 51{enter}");
    });
    expect(callbackProj).toBe("EPSG:3857");
});
it("should successfully call onClear if Button is clicked", async () => {
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
    const { coordInput, coordinateSearchGroup } = await waitForCoordinateSearch();
    await act(async () => {
        await user.type(coordInput, "404000 5700000{enter}");
    });
    const clearButton = getClearButton(coordinateSearchGroup);
    expect(cleared).toBe(false);
    await act(async () => {
        await user.click(clearButton);
    });
    expect(cleared).toBe(true);
});

async function waitForCoordinateSearch() {
    const { coordsSearchDiv, coordInput, coordinateSearchGroup, projSelect } = await waitFor(
        async () => {
            const coordsSearchDiv = await screen.findByTestId("coordinate-search");

            const coordinateSearchGroup = coordsSearchDiv.querySelector(".coordinateSearchGroup");
            if (!coordinateSearchGroup) {
                throw new Error("coordinate search group not rendered");
            }

            const coordInput = coordinateSearchGroup.querySelector("#coordinateInput");
            if (!coordInput) {
                throw new Error("coordinate search input field not rendered");
            }

            const projSelect: HTMLElement | null =
                coordinateSearchGroup.querySelector("#selectCoordinateSystem");
            if (!projSelect) {
                throw new Error("coordinate search projection select not rendered");
            }

            return { coordsSearchDiv, coordInput, coordinateSearchGroup, projSelect };
        }
    );

    return { coordsSearchDiv, coordInput, coordinateSearchGroup, projSelect };
}

function showDropdown(projSelect: HTMLElement) {
    // open dropdown to include options in snapshot; react-select creates list of options in dom after opening selection
    act(() => {
        fireEvent.keyDown(projSelect, { key: "ArrowDown" });
    });
}

function getCurrentOptions(projSelect: HTMLElement) {
    return Array.from(
        projSelect.getElementsByClassName("coordinate-Search-Select__option")
    ) as HTMLElement[];
}

function getClearButton(coordinateSearchGroup: Element) {
    const clearButton = coordinateSearchGroup.querySelector("#clearCoordinateSearch");
    if (!clearButton) {
        throw new Error("coordinate search clear button not rendered");
    }
    return clearButton;
}
