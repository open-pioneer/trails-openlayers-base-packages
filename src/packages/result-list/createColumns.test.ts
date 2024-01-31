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
        // Slice away the selection checkbox column
        const columns = createColumns(metaData).slice(1);
        expect(columns.length).toEqual(metaData.length);
        columns.forEach((column, index) => {
            //Column-ID is correct
            expect(column?.id).toEqual("result-list-col_" + index);
            //Column-Header is correct
            if (metaData[index]?.displayName) {
                expect(column?.header).toEqual(metaData[index]?.displayName);
            } else {
                expect(column?.header).toEqual(metaData[index]?.propertyName);
            }
            // no column-size testing because of recalculation based on column definition
        });
    });
    // TODO: Add tests for width calculation?
});

function createMetaData() {
    const dummyMetaData: ResultColumn[] = [
        {
            propertyName: "properties.a",
            displayName: "Spalte A",
            width: 100
        },
        {
            propertyName: "properties.b",
            displayName: "Spalte B",
            width: 50
        },
        {
            propertyName: "properties.c",
            displayName: "Spalte C",
            width: 150
        },
        {
            propertyName: "properties.d",
            displayName: "Spalte D",
            width: 75
        },
        {
            propertyName: "properties.e",
            displayName: "Spalte E",
            width: 50
        }
    ];

    return dummyMetaData;
}
