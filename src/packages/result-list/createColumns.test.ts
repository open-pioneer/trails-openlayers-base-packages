// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, vi, it, describe } from "vitest";
import { ResultColumn } from "./api";
import { createColumns } from "./createColumns";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("create columns for result-list", () => {
    it("expect createColumn to create Columns correctly", async () => {
        const metaData = createMetaData();
        const columns = createColumns(metaData);
        expect(columns.length).toEqual(metaData.length);
        columns.forEach((column, index) => {
            //Column-ID is correct
            expect(column?.id).toEqual("result-list-col_" + index);
            //Column-Header is correct
            if (metaData[index]?.displayName) {
                expect(column?.header).toEqual(metaData[index]?.displayName);
            } else {
                expect(column?.header).toEqual(metaData[index]?.attributeName);
            }
            //Column-Size is correct
            if (metaData[index]?.width) {
                expect(column?.size).toEqual(metaData[index]?.width);
            }
        });
    });
});

function createMetaData() {
    const dummyMetaData: ResultColumn[] = [
        {
            attributeName: "properties.a",
            displayName: "Spalte A",
            width: 100
        },
        {
            attributeName: "properties.b",
            displayName: "Spalte B",
            width: 50
        },
        {
            attributeName: "properties.c",
            displayName: "Spalte C",
            width: 150
        },
        {
            attributeName: "properties.d",
            displayName: "Spalte D",
            width: 75
        },
        {
            attributeName: "properties.e",
            displayName: "Spalte E",
            width: 50
        }
    ];

    return dummyMetaData;
}
