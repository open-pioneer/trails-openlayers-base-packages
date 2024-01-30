// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, it, vi } from "vitest";
import { ResultColumn, ResultListInput } from "./api";
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
    }).toThrowErrorMatchingSnapshot('"illegalArgumentException"');
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

// TODO: Writing tests for:
//  - Test display of all data types (boolean, number, undefined, date)

async function waitForResultList() {
    const { resultListDiv, allHeaderElements, allRows, selectAllSelect, selectRowSelects } =
        await waitFor(async () => {
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

            return { resultListDiv, allHeaderElements, allRows, selectAllSelect, selectRowSelects };
        });

    return { resultListDiv, allHeaderElements, allRows, selectAllSelect, selectRowSelects };
}
