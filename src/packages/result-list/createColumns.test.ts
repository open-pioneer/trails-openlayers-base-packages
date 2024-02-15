// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, vi, it, describe } from "vitest";
import { ResultColumn } from "./api";
import { createColumns, SELECT_COLUMN_SIZE } from "./createColumns";
import { dummyMetaDataMissingWidth } from "./testSources";
import { createIntl } from "@open-pioneer/test-utils/vanilla";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("create columns for result-list", () => {
    const intl = createIntl();

    it("expect createColumn to create Columns correctly", async () => {
        const metaData = createMetaData();

        // Slice away the selection checkbox column
        const columns = createColumns(metaData, intl).slice(1);
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
        });
    });
    it("expect createColumn to distribute remaining width on columns with undefined width", async () => {
        const metaData = dummyMetaDataMissingWidth;
        const fullWidth = 1000;
        // Slice away the selection checkbox column
        const columns = createColumns(metaData, intl, fullWidth).slice(1);
        const expectedWidth = (fullWidth - SELECT_COLUMN_SIZE - 300) / 2;
        expect(columns[0]?.size).toEqual(metaData[0]!.width);
        expect(columns[1]?.size).toEqual(expectedWidth);
        expect(columns[2]?.size).toEqual(expectedWidth);
        expect(columns[3]?.size).toEqual(metaData[3]!.width);
    });
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
