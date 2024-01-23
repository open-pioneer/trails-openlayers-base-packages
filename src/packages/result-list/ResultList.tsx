// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC, useMemo } from "react";
import { DataTable } from "./DataTable";
import { ResultColumn } from "./api";
import { createColumns } from "./createColumns";
import { BaseFeature } from "@open-pioneer/map/api/BaseFeature";
import { v4 as uuid4v } from "uuid";

export interface ResultListProps extends CommonComponentProps {
    data: BaseFeature[];
    metadata: ResultColumn[];
}

export interface ResultListData {
    internalId: string;
    data: BaseFeature;
}

export const ResultList: FC<ResultListProps> = (props) => {
    const { data, metadata } = props;
    // TODO: Remove test data
    //const data = dummyFeatureData;
    //const columns = useMemo(() => createColumns(dummyMetaData), [dummyMetaData]);
    const resultListData = createResultListData(data);

    const { containerProps } = useCommonComponentProps("result-list", props);
    const columns = useMemo(() => createColumns(metadata), [metadata]);

    return (
        <Box {...containerProps} height="100%" overflowY="auto">
            <DataTable columns={columns} data={resultListData} />
        </Box>
    );
};

function createResultListData(data: BaseFeature[]) {
    return data.map((dataItem) => {
        // TODO Reconsider uuid?
        return { internalId: uuid4v(), data: dataItem };
    });
}
