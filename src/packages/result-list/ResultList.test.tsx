// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BaseFeature, ZoomOptions } from "@open-pioneer/map";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Point } from "ol/geom";
import { disableReactActWarnings } from "test-utils";
import { Mock, afterEach, beforeEach, expect, it, vi } from "vitest";
import { ResultColumn, ResultList, ResultListInput } from "./ResultList";

beforeEach(() => {
    disableReactActWarnings();
});

afterEach(() => {
    vi.restoreAllMocks();
});

it("expect result list to be created successfully", async () => {
    const { map, injectedServices } = await createDependencies();

    render(
        <PackageContextProvider services={injectedServices}>
            <ResultList
                input={{ data: dummyFeatureData, columns: dummyColumns }}
                map={map}
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { resultListDiv } = await waitForResultList();
    expect(resultListDiv).toMatchSnapshot();
});

it("expect result list column and row count to match data/metadata", async () => {
    const { map, injectedServices } = await createDependencies();

    render(
        <PackageContextProvider services={injectedServices}>
            <ResultList
                input={{ data: dummyFeatureData, columns: dummyColumns }}
                map={map}
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { allHeaderElements, allRows } = await waitForResultList();

    // +1 because of the added selection column
    expect(allHeaderElements.length).toEqual(dummyColumns.length + 1);
    expect(allRows.length).toEqual(dummyFeatureData.length);
});

it("expect empty data text to be shown", async () => {
    const { map, injectedServices } = await createDependencies();
    const emptyData: ResultListInput = {
        data: [],
        columns: dummyColumns
    };

    let error;
    try {
        render(
            <PackageContextProvider services={injectedServices}>
                <ResultList input={emptyData} map={map} data-testid="result-list" />
            </PackageContextProvider>
        );
    } catch (_e) {
        error = new Error("unexpected failure");
    }

    const { resultListDiv } = await waitForResultList();

    expect(error).not.toBeDefined();
    expect(resultListDiv.textContent).toEqual("noDataMessage");
    expect(resultListDiv).toMatchSnapshot();
});

it("expect empty metadata to throw error", async () => {
    const { map, injectedServices } = await createDependencies();

    const emptyMetadata: ResultListInput = {
        data: dummyFeatureData,
        columns: []
    };

    expect(() => {
        render(
            <PackageContextProvider services={injectedServices}>
                <ResultList input={emptyMetadata} map={map} data-testid="result-list" />
            </PackageContextProvider>
        );
    }).toThrowErrorMatchingSnapshot();
});

it("expect getPropertyValue to be used correctly", async () => {
    const { map, injectedServices } = await createDependencies();

    const getPropertyValueMock = vi.fn((_feature) => {
        return "virtual property";
    });

    const dummyFeatureData: BaseFeature[] = [
        {
            id: "1",
            properties: {
                "b": "123",
                "c": undefined
            },
            geometry: undefined
        }
    ];
    const columns: ResultColumn[] = [
        {
            propertyName: "properties.b",
            displayName: "Spalte B",
            width: 50,
            getPropertyValue: getPropertyValueMock
        }
    ];
    const resultListInput = {
        data: dummyFeatureData,
        columns: columns
    };

    render(
        <PackageContextProvider services={injectedServices}>
            <ResultList input={resultListInput} map={map} data-testid="result-list" />
        </PackageContextProvider>
    );

    const { allRows } = await waitForResultList();

    expect(getPropertyValueMock).toHaveBeenCalled();
    expect(getPropertyValueMock).toHaveBeenCalledWith(dummyFeatureData[0]);
    expect(allRows[0]!.children[1]?.textContent).toEqual("virtual property");
});

it("expect changes of data and metadata to change full table", async () => {
    const { map, injectedServices } = await createDependencies();

    const renderResult = render(
        <PackageContextProvider services={injectedServices}>
            <ResultList
                input={{ data: dummyFeatureData, columns: dummyColumns }}
                map={map}
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { allHeaderElements, allRows } = await waitForResultList();

    // +1 because of the added selection column
    expect(allHeaderElements.length).toEqual(dummyColumns.length + 1);
    expect(allRows.length).toEqual(dummyFeatureData.length);

    renderResult.rerender(
        <PackageContextProvider services={injectedServices}>
            <ResultList
                input={{ data: dummyFeatureDataAlt, columns: dummyMetaDataAlt }}
                map={map}
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { allHeaderElements: allHeaderElementsAlt, allRows: allRowsAlt } =
        await waitForResultList();

    // Ensure dummydata is different
    expect(allHeaderElements.length).not.toEqual(allHeaderElementsAlt.length);
    expect(allRows.length).not.toEqual(allRowsAlt.length);
    // +1 because of the added selection column
    expect(allHeaderElementsAlt.length).toEqual(dummyMetaDataAlt.length + 1);
    expect(allRowsAlt.length).toEqual(dummyFeatureDataAlt.length);
});

it("expect selection column to be added", async () => {
    const { map, injectedServices } = await createDependencies();

    render(
        <PackageContextProvider services={injectedServices}>
            <ResultList
                input={{ data: dummyFeatureData, columns: dummyColumns }}
                map={map}
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { selectAllSelect, selectRowCheckboxes } = await waitForResultList();
    expect(selectAllSelect).toBeDefined();
    expect(selectRowCheckboxes).toBeDefined();
    expect(selectRowCheckboxes.length).toEqual(dummyFeatureData.length);
});

it("expect all rows to be selected and deselected", async () => {
    const { map, injectedServices } = await createDependencies();

    render(
        <PackageContextProvider services={injectedServices}>
            <ResultList
                input={{ data: dummyFeatureData, columns: dummyColumns }}
                map={map}
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { selectAllSelect, selectRowCheckboxes } = await waitForResultList();
    expect(selectAllSelect).toBeDefined();
    expect(selectRowCheckboxes.length).toBeGreaterThan(0);

    expect(selectAllSelect!.checked).toBeFalsy();
    selectRowCheckboxes.forEach((checkbox) => expect(checkbox.checked).toBeFalsy());

    act(() => {
        fireEvent.click(selectAllSelect!);
    });
    await waitFor(() => {
        expect(selectAllSelect!.checked).toBeTruthy();
        selectRowCheckboxes.forEach((checkbox) => expect(checkbox.checked).toBeTruthy());
    });

    act(() => {
        fireEvent.click(selectAllSelect!);
    });
    await waitFor(() => {
        expect(selectAllSelect!.checked).toBeFalsy();
        selectRowCheckboxes.forEach((checkbox) => expect(checkbox.checked).toBeFalsy());
    });
});

it("expect only single rows to be selected and deselected by radio buttons", async () => {
    const { map, injectedServices } = await createDependencies();
    const user = userEvent.setup();

    render(
        <PackageContextProvider services={injectedServices}>
            <ResultList
                input={{ data: dummyFeatureData, columns: dummyColumns }}
                map={map}
                selectionMode={"single"}
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { selectAllSelect, selectRowCheckboxes, selectRowRadios } = await waitForResultList();
    expect(selectAllSelect).toBeNull();
    expect(selectRowCheckboxes.length).toEqual(0);
    expect(selectRowRadios.length).not.toEqual(0);

    selectRowRadios.forEach((radio) => expect(radio.checked).toBeFalsy());

    await user.type(selectRowRadios[0]!, "{Space}");
    await waitFor(() => {
        expect(selectRowRadios[0]!.checked).toBeTruthy();
    });

    await user.type(selectRowRadios[1]!, "{Space}");
    await waitFor(() => {
        expect(selectRowRadios[1]!.checked).toBeTruthy();
        expect(selectRowRadios[0]!.checked).toBeFalsy();
    });
});

it("expect only single rows to be selected and deselected by checkboxes", async () => {
    const { map, injectedServices } = await createDependencies();
    const user = userEvent.setup();

    render(
        <PackageContextProvider services={injectedServices}>
            <ResultList
                input={{ data: dummyFeatureData, columns: dummyColumns }}
                map={map}
                selectionMode="single"
                selectionStyle="checkbox"
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { selectAllSelect, selectRowCheckboxes, selectRowRadios } = await waitForResultList();
    expect(selectAllSelect).toBeNull();
    expect(selectRowCheckboxes.length).not.toEqual(0);
    expect(selectRowRadios.length).toEqual(0);

    selectRowCheckboxes.forEach((checkbox) => expect(checkbox.checked).toBeFalsy());

    await user.type(selectRowCheckboxes[0]!, "{Space}");
    expect(selectRowCheckboxes[0]!.checked).toBeTruthy();

    await user.type(selectRowCheckboxes[1]!, "{Space}");
    expect(selectRowCheckboxes[0]!.checked).toBeFalsy();
    expect(selectRowCheckboxes[1]!.checked).toBeTruthy();
});

it("expect result list display all data types except dates", async () => {
    const { map, injectedServices } = await createDependencies();

    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <ResultList
                input={{
                    data: dummyFeatureData,
                    columns: dummyColumns,
                    formatOptions: {
                        numberOptions: { maximumFractionDigits: 3 }
                    }
                }}
                map={map}
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { allRows } = await waitForResultList();
    const firstRowCells = Array.from(allRows[0]!.querySelectorAll("td"));
    expect(firstRowCells).toHaveLength(6);

    const [selectCell, stringCell, integerCell, floatCell, trueCell] = firstRowCells;
    expect(selectCell!.innerHTML).includes("<input");
    expect(stringCell!.textContent).toBe("Test");
    expect(integerCell!.textContent).toBe("123");
    expect(floatCell!.textContent).toBe("4,567");
    expect(trueCell!.textContent).toBe("displayBoolean.true");

    const falseCell = allRows[1]?.querySelectorAll("td")[4];
    expect(falseCell!.textContent).toBe("displayBoolean.false");

    // Null / Undefined is rendered as an empty string
    const lastRowCells = Array.from(allRows[3]!.querySelectorAll("td"));
    expect(lastRowCells).toHaveLength(6);
    for (let i = 0; i < 6; ++i) {
        const cell = lastRowCells[i]!;
        expect(cell.textContent, "cell " + i).toBe("");
    }
});

it("expect result list display date in given format", async () => {
    const { map, injectedServices } = await createDependencies();

    const dateTimeFormatOptions: Intl.DateTimeFormatOptions = {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone: "UTC"
    };

    let dateFormatter = Intl.DateTimeFormat("de-DE", dateTimeFormatOptions);
    const resultListComp = (
        <ResultList
            input={{
                data: dummyDateFeatureData,
                columns: dummyDateColumns,
                formatOptions: {
                    numberOptions: { maximumFractionDigits: 3 },
                    dateOptions: dateTimeFormatOptions
                }
            }}
            map={map}
            data-testid="result-list"
        />
    );

    const renderResult = render(
        <PackageContextProvider services={injectedServices} locale="de">
            {resultListComp}
        </PackageContextProvider>
    );

    const { allRows } = await waitForResultList();
    const firstRowCells = Array.from(allRows[0]!.querySelectorAll("td"));
    const [_, dateCell] = firstRowCells;
    expect(dateCell!.textContent).toBe(dateFormatter.format(new Date("2020-05-12T23:50:21.817Z")));

    renderResult.rerender(
        <PackageContextProvider services={injectedServices} locale="en">
            {resultListComp}
        </PackageContextProvider>
    );
    await waitForResultList();

    dateFormatter = Intl.DateTimeFormat("en-US", dateTimeFormatOptions);
    expect(dateCell!.textContent).toBe(dateFormatter.format(new Date("2020-05-12T23:50:21.817Z")));
});

it("expect render function to be applied", async () => {
    const { map, injectedServices } = await createDependencies();

    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <ResultList
                input={{
                    data: dummyDateFeatureData,
                    columns: dummyColumnsWithRenderFunc
                }}
                map={map}
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { allRows } = await waitForResultList();
    const firstRowCells = Array.from(allRows[0]!.querySelectorAll("td"));
    const [_, dateCell] = firstRowCells;
    expect(dateCell!.textContent).toMatchSnapshot();
});

it("expect result-list throws selection change event", async () => {
    const { map, injectedServices } = await createDependencies();
    const user = userEvent.setup();

    const selectionChangeListener = vi.fn();
    render(
        <PackageContextProvider services={injectedServices}>
            <ResultList
                map={map}
                input={{ data: dummyFeatureData, columns: dummyColumns }}
                data-testid="result-list"
                onSelectionChange={selectionChangeListener}
            />
        </PackageContextProvider>
    );

    const { selectAllSelect } = await waitForResultList();

    // Select all
    await user.type(selectAllSelect!, "{Space}");

    let features = getSelectionsEvent(selectionChangeListener, 0).features;
    const expectedIds = features.map((feature: BaseFeature) => feature.id);
    const actualIds = getSelectionsEvent(selectionChangeListener, 0).getFeatureIds();
    expect(features).toEqual(dummyFeatureData);
    expect(actualIds).toEqual(expectedIds);

    // Deselect All
    await user.type(selectAllSelect!, "{Space}");
    features = getSelectionsEvent(selectionChangeListener, 1).features;
    expect(features).toEqual([]);

    /**
     * 1 Selection
     * 1 Deselection
     * = 2
     */
    expect(selectionChangeListener).toHaveBeenCalledTimes(2);
});

it("should not zoom the map further than the default maxZoom", async () => {
    const { map, injectedServices } = await createDependencies();

    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <ResultList
                input={{
                    data: dummyFeatureData,
                    columns: dummyColumns
                }}
                map={map}
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    await waitForResultList();
    const mapZoom = map.olMap.getView().getZoom();

    //default maxZoom is 20
    expect(mapZoom).toBeLessThanOrEqual(20);
});

it("should not zoom the map further than the configured maxZoom", async () => {
    const { map, injectedServices } = await createDependencies();

    const zoomOptions: ZoomOptions = { maxZoom: 11 };
    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <ResultList
                input={{
                    data: dummyFeatureData,
                    columns: dummyColumns
                }}
                map={map}
                data-testid="result-list"
                zoomOptions={zoomOptions}
            />
        </PackageContextProvider>
    );

    await waitForResultList();
    const mapZoom = map.olMap.getView().getZoom();

    expect(mapZoom).toBeLessThanOrEqual(11);
});

it("should be possible to disable zooming altogether", async () => {
    const { map, injectedServices } = await createDependencies();

    /** mapZoom before data is loaded into result-list */
    const mapZoomBefore = map.olMap.getView().getZoom();

    render(
        <PackageContextProvider services={injectedServices} locale="de">
            <ResultList
                input={{
                    data: dummyFeatureData,
                    columns: dummyColumns
                }}
                map={map}
                data-testid="result-list"
                enableZoom={false}
            />
        </PackageContextProvider>
    );

    await waitForResultList();

    /** mapZoom after data is loaded into result-list */
    const mapZoomAfter = map.olMap.getView().getZoom();

    expect(mapZoomBefore).toEqual(mapZoomAfter);
});

function getSelectionsEvent(listener: Mock, call: number) {
    return listener.mock.calls![call]![0];
}

async function createDependencies() {
    const { map, registry } = await setupMap();
    const injectedServices = createServiceOptions({ registry });
    return { map, registry, injectedServices };
}

async function waitForResultList() {
    return await waitFor(async () => {
        const resultListDiv: HTMLDivElement | null =
            await screen.findByTestId<HTMLDivElement>("result-list");
        if (!resultListDiv) {
            throw new Error("Result list not rendered");
        }

        const allHeaderElements = Array.from(
            resultListDiv.querySelectorAll<HTMLTableCellElement>("thead tr th")
        );
        const allRows = Array.from(resultListDiv.querySelectorAll<HTMLElement>("tbody tr"));
        const allCells = Array.from(resultListDiv.querySelectorAll<HTMLElement>("tbody td"));

        const selectAllSelect = resultListDiv.querySelector<HTMLInputElement>(
            ".result-list-select-all-checkbox input"
        );

        const selectRowCheckboxes = Array.from(
            resultListDiv.querySelectorAll<HTMLInputElement>(
                ".result-list-select-row-checkbox input[type='checkbox']"
            )
        );

        const selectRowRadios = Array.from(
            resultListDiv.querySelectorAll<HTMLInputElement>(
                ".result-list-select-row-container input[type='radio']"
            )
        );

        return {
            resultListDiv,
            allHeaderElements,
            allRows,
            allCells,
            selectAllSelect,
            selectRowCheckboxes,
            selectRowRadios
        };
    });
}

const DATE_FORMAT = Intl.DateTimeFormat("de-DE", {
    dateStyle: "full",
    timeStyle: "full",
    timeZone: "UTC"
});

// Stable date format for tests.
function formatDate(date: Date) {
    return DATE_FORMAT.format(date);
}

const dummyDateFeatureData: BaseFeature[] = [
    {
        id: "1",
        properties: {
            "a": new Date("2020-05-12T23:50:21.817Z")
        },
        geometry: undefined
    }
];

const dummyDateColumns: ResultColumn[] = [
    {
        propertyName: "a",
        displayName: "Spalte A",
        width: 100
    }
];

const dummyColumnsWithRenderFunc: ResultColumn[] = [
    {
        propertyName: "a",
        displayName: "Spalte A",
        width: 100,
        renderCell: ({ feature }) => (
            <div className="renderTest">{`This item has the following ID: ${feature.id}`}</div>
        )
    }
];

const dummyFeatureData: BaseFeature[] = [
    {
        id: "1",
        properties: {
            "a": "Test",
            "b": 123,
            "c": 4.5671365,
            "d": true,
            "e": formatDate(new Date("2020-05-12T23:50:21.817Z"))
        },
        geometry: new Point([404567.3, 5757788.32])
    },
    {
        id: "2",
        properties: {
            "a": "Test123",
            "b": 434,
            "c": 78.567,
            "d": false,
            "e": formatDate(new Date("2021-05-12T23:50:21.817Z"))
        },
        geometry: new Point([406510.87, 5758314.82])
    },
    {
        id: "3",
        properties: {
            "a": "Testabc",
            "b": 666,
            "c": 8.597,
            "d": true,
            "e": formatDate(new Date("2020-10-12T23:30:21.817Z"))
        },
        geometry: new Point([406590.87, 5758311.82])
    },
    {
        id: "4",
        properties: {
            "a": null,
            "b": undefined,
            "c": "",
            "d": undefined,
            "e": undefined
        },
        geometry: new Point([406590.87, 5758311.82])
    },
    {
        id: "5",
        properties: {
            "a": NaN,
            "b": NaN,
            "c": NaN,
            "d": NaN,
            "e": NaN
        },
        geometry: undefined
    }
];

const dummyColumns: ResultColumn[] = [
    {
        propertyName: "a",
        displayName: "Spalte A",
        width: 100
    },
    {
        propertyName: "b",
        displayName: "Spalte B",
        width: 50
    },
    {
        propertyName: "c",
        displayName: "Spalte C",
        width: 150
    },
    {
        propertyName: "d",
        displayName: "Spalte D",
        width: 75
    },
    {
        propertyName: "e",
        displayName: "Spalte E",
        width: 50
    }
];

const dummyFeatureDataAlt: BaseFeature[] = [
    {
        id: "1",
        properties: {
            "f": "Test 42",
            "g": undefined
        },
        geometry: undefined
    }
];

const dummyMetaDataAlt: ResultColumn[] = [
    {
        propertyName: "f",
        displayName: "Spalte F",
        width: 200
    },
    {
        propertyName: "g",
        displayName: "Spalte G",
        width: 300
    }
];
