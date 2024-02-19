// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createIntl } from "@open-pioneer/test-utils/vanilla";
import { AccessorFnColumnDef } from "@tanstack/react-table";
import { afterEach, expect, it, vi } from "vitest";
import { ResultColumn } from "../ResultList";
import { SELECT_COLUMN_SIZE, createColumns } from "./createColumns";

afterEach(() => {
    vi.restoreAllMocks();
});

const intl = createIntl();

it("expect createColumn to create columns correctly", async () => {
    const resultListColumns = createResultListColumns();

    // Slice away the selection checkbox column
    const columns = createColumns({ columns: resultListColumns, intl: intl }).slice(1);
    expect(columns.length).toEqual(resultListColumns.length);
    const [simplePropColumn, colWithDisplayName, colWithWidth, colWithGetter] = columns;

    expect(simplePropColumn!.id).toBe("result-list-col_0");
    expect(simplePropColumn!.header).toBe("a");

    expect(colWithDisplayName!.id).toBe("result-list-col_1");
    expect(colWithDisplayName!.header).toBe("column title");

    expect(colWithWidth!.id).toBe("result-list-col_2");
    expect(colWithWidth!.size).toBe(150);

    expect(colWithGetter!.id).toBe("result-list-col_3");
    expect((colWithGetter as AccessorFnColumnDef<unknown>).accessorFn({} as any, 123)).toBe(
        "virtual value"
    );
});

it("expect createColumn to distribute remaining width on columns with undefined width", async () => {
    const metaData = dummyMetaDataMissingWidth;
    const fullWidth = 1000;
    // Slice away the selection checkbox column
    const columns = createColumns({ columns: metaData, intl: intl, tableWidth: fullWidth }).slice(
        1
    );
    const expectedWidth = (fullWidth - SELECT_COLUMN_SIZE - 300) / 2;
    expect(columns[0]?.size).toEqual(metaData[0]!.width);
    expect(columns[1]?.size).toEqual(expectedWidth);
    expect(columns[2]?.size).toEqual(expectedWidth);
    expect(columns[3]?.size).toEqual(metaData[3]!.width);
});

function createResultListColumns() {
    const columns: ResultColumn[] = [
        {
            // no display name
            propertyName: "a"
        },
        {
            // display name
            displayName: "column title",
            propertyName: "a"
        },
        {
            // explicit width
            propertyName: "c",
            width: 150
        },
        {
            // Getter
            propertyName: "d",
            getPropertyValue(_feature) {
                return "virtual value";
            }
        }
    ];

    return columns;
}

const dummyMetaDataMissingWidth: ResultColumn[] = [
    {
        propertyName: "h",
        displayName: "Spalte H",
        width: 100
    },
    {
        propertyName: "i",
        displayName: "Spalte I"
    },
    {
        propertyName: "j",
        displayName: "Spalte J"
    },
    {
        propertyName: "k",
        displayName: "Spalte K",
        width: 200
    }
];
