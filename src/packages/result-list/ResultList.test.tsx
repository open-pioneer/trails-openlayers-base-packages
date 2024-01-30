// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, it, vi } from "vitest";
import { ResultColumn, ResultListInput } from "./api";
import { render, screen, waitFor } from "@testing-library/react";
import {
    dummyFeatureData,
    dummyFeatureDataAlt,
    dummyMetaData,
    dummyMetaDataAlt
} from "./testSources";
import { ResultList } from "./ResultList";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";

afterEach(() => {
    // TODO: Needed?
    document.body.innerHTML = ""; // clear
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

it("expect empty data + non empty meta to be allowed", async () => {
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
    expect(error).not.toBeDefined();
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
    }).toThrowErrorMatchingInlineSnapshot('"illegalArgumentException"');
});

it("expect getPropertyValue to be used correctly", async () => {
    const getPropertyValueMock = vi.fn((_) => {
        return "";
    });
    const dummyMetaData: ResultColumn[] = [
        {
            propertyName: "properties.a",
            displayName: "Spalte A",
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

    // TODO: Test Cell Value

    expect(getPropertyValueMock).toHaveBeenCalledTimes(dummyFeatureData.length);
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

    expect(allHeaderElements.length).not.toEqual(allHeaderElementsAlt.length);
    expect(allRows.length).not.toEqual(allRowsAlt.length);
    // +1 because of the added selection column
    expect(allHeaderElementsAlt.length).toEqual(dummyMetaDataAlt.length + 1);
    expect(allRowsAlt.length).toEqual(dummyFeatureDataAlt.length);
});

// TODO: Writing tests for:
//  - Fallback text is beeing shown if no data?
//  - Is selection column there?
//  - Test button for (de-)select all
//  - Test display of all data types (boolean, number, undefined, date)

async function waitForResultList() {
    const { resultListDiv, allHeaderElements, allRows } = await waitFor(async () => {
        const resultListDiv: HTMLDivElement | null =
            await screen.findByTestId<HTMLDivElement>("result-list");
        if (!resultListDiv) {
            throw new Error("Result list not rendered");
        }

        // TODO: Test with headers
        const allHeaderElements = resultListDiv.querySelectorAll<HTMLSelectElement>("thead tr th");

        if (!allHeaderElements) {
            throw new Error("Result list headers not rendered");
        }

        // TODO: Test with rows
        const allRows = resultListDiv.querySelectorAll<HTMLSelectElement>("tbody tr");

        return { resultListDiv, allHeaderElements, allRows };
    });

    return { resultListDiv, allHeaderElements, allRows };
}
