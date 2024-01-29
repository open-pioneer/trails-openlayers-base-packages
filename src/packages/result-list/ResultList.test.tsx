// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, it, vi } from "vitest";
import { ResultColumn, ResultListInput } from "./api";
import { render, screen, waitFor } from "@testing-library/react";
import { dummyFeatureData, dummyMetaData } from "./testSources";
import { ResultList } from "./ResultList";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { getErrorChain } from "@open-pioneer/core";

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

it("expect empty data + empty meta to be allowed", async () => {
    const emptyInput: ResultListInput = {
        data: [],
        metadata: []
    };

    let error;
    try {
        render(
            <PackageContextProvider>
                <ResultList resultListInput={emptyInput} data-testid="result-list" />
            </PackageContextProvider>
        );
    } catch (e) {
        error = new Error("unexpected failure");
    }
    expect(error).not.toBeDefined();
});

it("expect empty data + non empty meta to throw error", async () => {
    const halfEmptyInput: ResultListInput = {
        data: [],
        metadata: dummyMetaData
    };

    let error;
    try {
        render(
            <PackageContextProvider>
                <ResultList resultListInput={halfEmptyInput} data-testid="result-list" />
            </PackageContextProvider>
        );
        throw new Error("unexpected success");
    } catch (e) {
        error = e as Error;
    }
    expect(error.message).not.toEqual("unexpected success");
    const chain = getErrorChain(error);
    const messages = chain.map((error) => error.message);
    expect(messages).toMatchInlineSnapshot(`
      [
        "illegalArgumentException",
      ]
    `);
});

it("expect non empty data + empty meta to throw error", async () => {
    const halfEmptyInput: ResultListInput = {
        data: dummyFeatureData,
        metadata: []
    };

    let error;
    try {
        render(
            <PackageContextProvider>
                <ResultList resultListInput={halfEmptyInput} data-testid="result-list" />
            </PackageContextProvider>
        );
        throw new Error("unexpected success");
    } catch (e) {
        error = e as Error;
    }
    expect(error.message).not.toEqual("unexpected success");
    const chain = getErrorChain(error);
    const messages = chain.map((error) => error.message);
    expect(messages).toMatchInlineSnapshot(`
      [
        "illegalArgumentException",
      ]
    `);
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

    expect(getPropertyValueMock).toHaveBeenCalledTimes(dummyFeatureData.length);
});

async function waitForResultList() {
    const { resultListDiv, allHeaderElements, allRows } = await waitFor(async () => {
        const resultListDiv: HTMLDivElement | null =
            await screen.findByTestId<HTMLDivElement>("result-list");
        if (!resultListDiv) {
            throw new Error("Result list not rendered");
        }

        // TODO: Test with headers
        const allHeaderElements = resultListDiv.querySelector<HTMLSelectElement>("th");

        if (!allHeaderElements) {
            throw new Error("Result list headers not rendered");
        }

        // TODO: Test with rows
        const allRows = resultListDiv.querySelector<HTMLSelectElement>("th");

        return { resultListDiv, allHeaderElements, allRows };
    });

    return { resultListDiv, allHeaderElements, allRows };
}
