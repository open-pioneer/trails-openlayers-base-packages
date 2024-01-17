// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createColumnHelper } from "@tanstack/react-table";
import { ResultColumn } from "./api";
import { BaseFeature } from "@open-pioneer/map/api/BaseFeature";

const columnHelper = createColumnHelper<BaseFeature>();

export function createColumns(metaData: ResultColumn[]) {
    // TODO: Remove unneeded code after clarification
    /*const fullWidth = metaData.reduce((sum, metaDataItem) => (metaDataItem.width ?? 0) + sum, 0);
    const undefinedWidthCount = metaData.reduce((sum, metaDataItem) => metaDataItem.width === undefined ? sum + 1 : sum, 0);
    const remainingWidth = (1920 - 50) - fullWidth;*/
    return metaData.map((metaDataItem, index) => {
        const columnWidth = metaDataItem.width; /*|| (remainingWidth / undefinedWidthCount);*/
        console.debug(`Width for col ${metaDataItem.displayName}: ${columnWidth}`);
        // @ts-expect-error: WIP
        return columnHelper.accessor(metaDataItem.name, {
            id: index + (metaDataItem.displayName || ""),
            cell: (info) => info.getValue(),
            header: metaDataItem.displayName,
            size: columnWidth
        });
    });
}
