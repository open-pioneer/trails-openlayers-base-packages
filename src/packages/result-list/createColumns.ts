// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createColumnHelper } from "@tanstack/react-table";
import { ResultColumn } from "./api";
import { v4 as uuid4v } from "uuid";
import { ResultListData } from "./ResultList";

const columnHelper = createColumnHelper<ResultListData>();

export function createColumns(metaData: ResultColumn[]) {
    // TODO: Remove unneeded code after clarification
    /*const fullWidth = metaData.reduce((sum, metaDataItem) => (metaDataItem.width ?? 0) + sum, 0);
    const undefinedWidthCount = metaData.reduce((sum, metaDataItem) => metaDataItem.width === undefined ? sum + 1 : sum, 0);
    const remainingWidth = (1920 - 50) - fullWidth;*/
    return metaData.map((metaDataItem, index) => {
        const columnWidth = metaDataItem.width; /*|| (remainingWidth / undefinedWidthCount);*/
        //console.debug(`Width for col ${metaDataItem.displayName}: ${columnWidth}`);
        return columnHelper.accessor(
            (resultListData: ResultListData) => {
                return resultListData.data.properties?.[metaDataItem.attributeName];
            },
            {
                id: "result-list-col_" + index, //metaDataItem.attributeName,
                cell: (info) => {
                    const data = info.row.original.data as unknown as Record<string, unknown>;
                    let cellValue = data[metaDataItem.attributeName];
                    cellValue =
                        cellValue ??
                        info.row.original.data.properties?.[metaDataItem.attributeName];
                    return String(cellValue); //info.getValue() || info.row.original.data[metaDataItem.attributeName];/*info.row.original.data.properties?.[metaDataItem.attributeName]; */
                },
                header: metaDataItem.displayName,
                size: columnWidth
            }
        );
    });
}
