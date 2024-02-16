// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, beforeEach, expect, it, Mock, SpyInstance, vi } from "vitest";
import { ResultColumn, ResultListInput, ResultListSelectionChangedEvent } from "./api";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
    dummyFeatureData,
    dummyFeatureDataAlt,
    dummyMetaData,
    dummyMetaDataAlt
} from "./testSources";
import { ResultList } from "./ResultList";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { BaseFeature } from "@open-pioneer/map/api/BaseFeature";

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
                resultListInput={{ data: dummyFeatureData, metadata: dummyMetaData }}
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
                resultListInput={{ data: dummyFeatureData, metadata: dummyMetaData }}
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { allHeaderElements, allRows } = await waitForResultList();

    // +1 because of the added selection column
    expect(allHeaderElements.length).toEqual(dummyMetaData.length + 1);
    expect(allRows.length).toEqual(dummyFeatureData.length);
});

it("expect empty data text to be shown", async () => {
    const emptyData: ResultListInput = {
        data: [],
        metadata: dummyMetaData
    };

    let error;
    try {
        render(
            <PackageContextProvider>
                <ResultList resultListInput={emptyData} data-testid="result-list" />
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
        metadata: []
    };

    expect(() => {
        render(
            <PackageContextProvider>
                <ResultList resultListInput={emptyMetadata} data-testid="result-list" />
            </PackageContextProvider>
        );
    }).toThrowErrorMatchingSnapshot();

    expect(errorSpy).toHaveBeenCalledOnce();
});

it("expect getPropertyValue to be used correctly", async () => {
    const getPropertyValueMock = vi.fn((feature) => {
        return feature.properties.b;
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
    const dummyMetaData: ResultColumn[] = [
        {
            propertyName: "properties.b",
            displayName: "Spalte B",
            width: 50,
            getPropertyValue: getPropertyValueMock
        }
    ];
    const resultListInput = {
        data: dummyFeatureData,
        metadata: dummyMetaData
    };

    render(
        <PackageContextProvider>
            <ResultList resultListInput={resultListInput} data-testid="result-list" />
        </PackageContextProvider>
    );

    const { allRows } = await waitForResultList();

    expect(getPropertyValueMock).toHaveBeenCalledTimes(dummyFeatureData.length);
    expect(allRows.item(0).children[1]?.textContent).toEqual(dummyFeatureData[0]?.properties?.b);
});

it("expect changes of data and metadata to change full table", async () => {
    const renderResult = render(
        <PackageContextProvider>
            <ResultList
                resultListInput={{ data: dummyFeatureData, metadata: dummyMetaData }}
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { allHeaderElements, allRows } = await waitForResultList();

    // +1 because of the added selection column
    expect(allHeaderElements.length).toEqual(dummyMetaData.length + 1);
    expect(allRows.length).toEqual(dummyFeatureData.length);

    renderResult.rerender(
        <PackageContextProvider>
            <ResultList
                resultListInput={{ data: dummyFeatureDataAlt, metadata: dummyMetaDataAlt }}
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
                resultListInput={{ data: dummyFeatureData, metadata: dummyMetaData }}
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
                resultListInput={{ data: dummyFeatureData, metadata: dummyMetaData }}
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

it("expect result list display all data types", async () => {
    render(
        <PackageContextProvider>
            <ResultList
                resultListInput={{ data: dummyFeatureData, metadata: dummyMetaData }}
                data-testid="result-list"
            />
        </PackageContextProvider>
    );

    const { allCells } = await waitForResultList();
    allCells.forEach((item, index) => {
        switch (index) {
            //Checkbox
            case 0:
                expect(item.innerHTML).contains("input");
                break;
            //String
            case 1:
                expect(item.innerHTML).toEqual("Test");
                break;
            //Integer
            case 2:
                expect(item.innerHTML).toEqual("123");
                break;
            //Double
            case 3:
                expect(item.innerHTML).toEqual("4.567");
                break;
            //Boolean
            case 4:
                expect(item.innerHTML).toEqual("true");
                break;
            //Date
            case 5:
                expect(item.innerHTML).toEqual(
                    "Dienstag, 12. Mai 2020 um 23:50:21 Koordinierte Weltzeit"
                );
                break;
            //Undefinded in all Datatypes
            case 19:
            case 20:
            case 21:
            case 22:
            case 23:
                expect(item.innerHTML).toEqual("");
                break;
        }
    });
});

it("expect result-list throws selection-change-Event", async () => {
    const selectionChangeListener = vi.fn();
    render(
        <PackageContextProvider>
            <ResultList
                resultListInput={{ data: dummyFeatureData, metadata: dummyMetaData }}
                data-testid="result-list"
                onSelectionChanged={selectionChangeListener}
            />
        </PackageContextProvider>
    );

    const { selectAllSelect } = await waitForResultList();

    // Result-List has empty Array
    let features = getSelectionsEvent(selectionChangeListener, 0).features;
    expect(features).toEqual([]);

    //Selection All
    act(() => {
        fireEvent.click(selectAllSelect!);
    });
    features = getSelectionsEvent(selectionChangeListener, 1).features;
    const realIds = features.map((feature: BaseFeature) => feature.id);
    const eventIds = getSelectionsEvent(selectionChangeListener, 1).getFeatureIds();

    // Result-List has Array of selected Features
    expect(features).toEqual(dummyFeatureData);

    //getFeatureIds method returns the correct Ids
    expect(eventIds).toEqual(realIds);

    //Deselect All
    act(() => {
        fireEvent.click(selectAllSelect!);
    });

    // Result-List has empty Array
    features = getSelectionsEvent(selectionChangeListener, 2).features;
    expect(features).toEqual([]);

    /**
     * 1 Start package
     * 1 Selection
     * 1 Deselection
     * = 3
     */
    expect(selectionChangeListener).toHaveBeenCalledTimes(3);
});

function getSelectionsEvent(listener: Mock, call: number) {
    return listener.mock.calls[call][0];
}

async function waitForResultList() {
    const {
        resultListDiv,
        allHeaderElements,
        allRows,
        allCells,
        selectAllSelect,
        selectRowSelects
    } = await waitFor(async () => {
        const resultListDiv: HTMLDivElement | null =
            await screen.findByTestId<HTMLDivElement>("result-list");
        if (!resultListDiv) {
            throw new Error("Result list not rendered");
        }

        const allHeaderElements =
            resultListDiv.querySelectorAll<HTMLTableHeaderCellElement>("thead tr th");

        const allRows = resultListDiv.querySelectorAll<HTMLElement>("tbody tr");
        const allCells = resultListDiv.querySelectorAll<HTMLElement>("tbody td");

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
            allCells,
            selectAllSelect,
            selectRowSelects
        };
    });

    return {
        resultListDiv,
        allHeaderElements,
        allRows,
        allCells,
        selectAllSelect,
        selectRowSelects
    };
}
