// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createColumnHelper } from "@tanstack/react-table";
import { ResultColumn } from "./api";
import { BaseFeature } from "@open-pioneer/map/api/BaseFeature";

const columnHelper = createColumnHelper<BaseFeature>();
const SELECT_COLUMN_SIZE = 70;

export function createColumns(metaData: ResultColumn[], tableWidth?: number) {
    const internalSelectColumn = createColumnHelper<BaseFeature>().display({
        id: "result-list-col_selection-buttons",
        size: SELECT_COLUMN_SIZE
    });

    const remainingColumnWidth: number | undefined =
        tableWidth === undefined ? undefined : calcRemainingColumnWidth(metaData, tableWidth);

    const columnDef = metaData.map((metaDataItem, index) => {
        const columnWidth = metaDataItem.width || remainingColumnWidth;
        const { propertyName, getPropertyValue } = metaDataItem;
        return columnHelper.accessor(
            (feature: BaseFeature) => {
                return getPropertyValue?.(feature) ?? feature.properties?.[propertyName];
            },
            {
                id: "result-list-col_" + index,
                cell: (info) => {
                    const cellValue =
                        getPropertyValue?.(info.row.original) ??
                        info.row.original.properties?.[propertyName];
                    return String(cellValue);
                },
                header: metaDataItem.displayName,
                size: columnWidth
            }
        );
    });

    return [internalSelectColumn, ...columnDef];
}

function calcRemainingColumnWidth(
    metaData: ResultColumn[],
    tableWidth: number,
    selectColumnWidth: number = SELECT_COLUMN_SIZE
) {
    const fullWidth = metaData.reduce((sum, metaDataItem) => (metaDataItem.width ?? 0) + sum, 0);
    const undefinedWidthCount = metaData.reduce(
        (sum, metaDataItem) => (metaDataItem.width === undefined ? sum + 1 : sum),
        0
    );
    const remainingWidth = tableWidth - selectColumnWidth - fullWidth;
    return remainingWidth / undefinedWidthCount;
}
