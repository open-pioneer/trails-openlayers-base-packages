// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createColumnHelper } from "@tanstack/react-table";
import { ResultListData, ResultColumn } from "./api";

const columnHelper = createColumnHelper<ResultListData>();

export function createColumns(metaData: ResultColumn[]) {
    return metaData.map((metaDataItem) => {
        // @ts-expect-error: WIP
        return columnHelper.accessor(metaDataItem.name, {
            cell: (info) => info.getValue(),
            header: metaDataItem.displayName
        });
    });
}
