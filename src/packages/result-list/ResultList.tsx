// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ChakraProvider, Box } from "@open-pioneer/chakra-integration";
import { createLogger } from "@open-pioneer/core";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { FC, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { ResultColumn } from "./api";

import { createColumns } from "./createColumns";
import { BaseFeature } from "@open-pioneer/map/api/BaseFeature";

const LOG = createLogger("result-list:ResultList");

export interface ResultListProps extends CommonComponentProps {
    data: BaseFeature[];
    metadata: ResultColumn[];
}

export const ResultList: FC<ResultListProps> = (props) => {
    const { data, metadata } = props;
    const { containerProps } = useCommonComponentProps("result-list", props);
    const columns = useMemo(() => createColumns(metadata), [metadata]);

    return (
        <ChakraProvider>
            <Box {...containerProps} maxHeight="300px" overflowY="auto">
                <DataTable columns={columns} data={data} />
            </Box>
        </ChakraProvider>
    );
};
