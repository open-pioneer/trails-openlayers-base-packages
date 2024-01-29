// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createColumnHelper } from "@tanstack/react-table";
import { ResultColumn } from "./api";
import { ResultListData } from "./ResultList";

const columnHelper = createColumnHelper<ResultListData>();

export function createColumns(metaData: ResultColumn[]) {
    // TODO: Remove unneeded code after clarification
    /*const fullWidth = metaData.reduce((sum, metaDataItem) => (metaDataItem.width ?? 0) + sum, 0);
    const undefinedWidthCount = metaData.reduce((sum, metaDataItem) => metaDataItem.width === undefined ? sum + 1 : sum, 0);
    const remainingWidth = (1920 - 50) - fullWidth;*/
    return metaData.map((metaDataItem, index) => {
        //const columnWidth = metaDataItem.width; /*|| (remainingWidth / undefinedWidthCount);*/
        //console.debug(`Width for col ${metaDataItem.displayName}: ${columnWidth}`);
        const { propertyName, width: columnWidth, getPropertyValue } = metaDataItem;
        return columnHelper.accessor(
            (resultListData: ResultListData) => {
                return (
                    getPropertyValue?.(resultListData.data) ||
                    resultListData.data.properties?.[propertyName]
                );
            },
            {
                id: "result-list-col_" + index,
                cell: (info) => {
                    const cellValue =
                        getPropertyValue?.(info.row.original.data) ||
                        info.row.original.data.properties?.[propertyName];
                    return String(cellValue);
                },
                header: metaDataItem.displayName,
                size: columnWidth
            }
        );
    });
}
