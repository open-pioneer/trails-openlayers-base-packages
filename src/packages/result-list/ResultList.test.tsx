// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BaseFeature } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SpyInstance, afterEach, beforeEach, expect, it, vi } from "vitest";
import { ResultColumn, ResultList, ResultListInput } from "./ResultList";
import { Point } from "ol/geom";

afterEach(() => {
    vi.restoreAllMocks();
});

let errorSpy!: SpyInstance;
beforeEach(() => {
    errorSpy = vi.spyOn(console, "error");
});

function doNothing() {}

it("expect result list to be created successfully", async () => {
    render(
        <PackageContextProvider>
            <ResultList
                input={{ data: dummyFeatureData, columns: dummyColumns }}
                mapId="foo"
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { resultListDiv } = await waitForResultList();
    expect(resultListDiv).toMatchSnapshot();
});

it("expect result list column and row count to match data/metadata", async () => {
    render(
        <PackageContextProvider>
            <ResultList
                input={{ data: dummyFeatureData, columns: dummyColumns }}
                mapId="foo"
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
    const emptyData: ResultListInput = {
        data: [],
        columns: dummyColumns
    };

    let error;
    try {
        render(
            <PackageContextProvider>
                <ResultList input={emptyData} mapId="foo" data-testid="result-list" />
            </PackageContextProvider>
        );
    } catch (e) {
        error = new Error("unexpected failure");
    }

    const { resultListDiv } = await waitForResultList();

    expect(error).not.toBeDefined();
    expect(resultListDiv.textContent).toEqual("noDataMessage");
    expect(resultListDiv).toMatchSnapshot();
});

it("expect empty metadata to throw error", async () => {
    errorSpy.mockImplementation(doNothing);

    const emptyMetadata: ResultListInput = {
        data: dummyFeatureData,
        columns: []
    };

    expect(() => {
        render(
            <PackageContextProvider>
                <ResultList input={emptyMetadata} mapId="foo" data-testid="result-list" />
            </PackageContextProvider>
        );
    }).toThrowErrorMatchingSnapshot();

    expect(errorSpy).toHaveBeenCalledOnce();
});

it("expect getPropertyValue to be used correctly", async () => {
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
        <PackageContextProvider>
            <ResultList input={resultListInput} mapId="foo" data-testid="result-list" />
        </PackageContextProvider>
    );

    const { allRows } = await waitForResultList();

    expect(getPropertyValueMock).toHaveBeenCalled();
    expect(getPropertyValueMock).toHaveBeenCalledWith(dummyFeatureData[0]);
    expect(allRows.item(0).children[1]?.textContent).toEqual("virtual property");
});

it("expect changes of data and metadata to change full table", async () => {
    const renderResult = render(
        <PackageContextProvider>
            <ResultList
                input={{ data: dummyFeatureData, columns: dummyColumns }}
                mapId="foo"
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { allHeaderElements, allRows } = await waitForResultList();

    // +1 because of the added selection column
    expect(allHeaderElements.length).toEqual(dummyColumns.length + 1);
    expect(allRows.length).toEqual(dummyFeatureData.length);

    renderResult.rerender(
        <PackageContextProvider>
            <ResultList
                input={{ data: dummyFeatureDataAlt, columns: dummyMetaDataAlt }}
                mapId="foo"
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
    render(
        <PackageContextProvider>
            <ResultList
                input={{ data: dummyFeatureData, columns: dummyColumns }}
                mapId="foo"
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { selectAllSelect, selectRowSelects } = await waitForResultList();
    expect(selectAllSelect).toBeDefined();
    expect(selectRowSelects).toBeDefined();
    expect(selectRowSelects.length).toEqual(dummyFeatureData.length);
});

it("expect all rows to be selected and deselected", async () => {
    render(
        <PackageContextProvider>
            <ResultList
                input={{ data: dummyFeatureData, columns: dummyColumns }}
                mapId="foo"
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { selectAllSelect, selectRowSelects } = await waitForResultList();
    expect(selectAllSelect).toBeDefined();
    expect(selectRowSelects).toBeDefined();

    expect(selectAllSelect!.checked).toBeFalsy();
    selectRowSelects.forEach((checkbox) => expect(checkbox.checked).toBeFalsy());

    act(() => {
        fireEvent.click(selectAllSelect!);
    });

    expect(selectAllSelect!.checked).toBeTruthy();
    selectRowSelects.forEach((checkbox) => expect(checkbox.checked).toBeTruthy());

    act(() => {
        fireEvent.click(selectAllSelect!);
    });

    expect(selectAllSelect!.checked).toBeFalsy();
    selectRowSelects.forEach((checkbox) => expect(checkbox.checked).toBeFalsy());
});

it("expect result list display all data types except dates", async () => {
    render(
        <PackageContextProvider locale="de">
            <ResultList
                input={{
                    data: dummyFeatureData,
                    columns: dummyColumns,
                    formatOptions: {
                        numberOptions: { maximumFractionDigits: 3 }
                    }
                }}
                mapId="foo"
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
            mapId="foo"
            data-testid="result-list"
        />
    );

    const renderResult = render(
        <PackageContextProvider locale="de">{resultListComp}</PackageContextProvider>
    );

    const { allRows } = await waitForResultList();
    const firstRowCells = Array.from(allRows[0]!.querySelectorAll("td"));
    const [_, dateCell] = firstRowCells;
    expect(dateCell!.textContent).toBe(dateFormatter.format(new Date("2020-05-12T23:50:21.817Z")));

    renderResult.rerender(
        <PackageContextProvider locale="en">{resultListComp}</PackageContextProvider>
    );
    await waitForResultList(); // TODO: Workaround to hide react warning due to useEffect (use disableReactWarning helper after printing merge)

    dateFormatter = Intl.DateTimeFormat("en-US", dateTimeFormatOptions);
    expect(dateCell!.textContent).toBe(dateFormatter.format(new Date("2020-05-12T23:50:21.817Z")));
});

it("expect render function to be applied", async () => {
    render(
        <PackageContextProvider locale="de">
            <ResultList
                input={{
                    data: dummyDateFeatureData,
                    columns: dummyColumnsWithRenderFunc
                }}
                mapId="foo"
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { allRows } = await waitForResultList();
    const firstRowCells = Array.from(allRows[0]!.querySelectorAll("td"));
    const [_, dateCell] = firstRowCells;
    expect(dateCell!.textContent).toMatchSnapshot();
});

async function waitForResultList() {
    return await waitFor(async () => {
        const resultListDiv: HTMLDivElement | null =
            await screen.findByTestId<HTMLDivElement>("result-list");
        if (!resultListDiv) {
            throw new Error("Result list not rendered");
        }

        const allHeaderElements =
            resultListDiv.querySelectorAll<HTMLTableHeaderCellElement>("thead tr th");

        const allRows = resultListDiv.querySelectorAll<HTMLElement>("tbody tr");

        const selectAllSelect = resultListDiv.querySelector<HTMLInputElement>(
            ".result-list-select-all-checkbox input"
        );

        const selectRowSelects = resultListDiv.querySelectorAll<HTMLInputElement>(
            ".result-list-select-row-checkbox input"
        );

        return {
            resultListDiv,
            allHeaderElements,
            allRows,
            selectAllSelect,
            selectRowSelects
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
