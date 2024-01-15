// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ChakraProvider, Box } from "@open-pioneer/chakra-integration";
import { createLogger } from "@open-pioneer/core";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { ResultListData, ResultColumn } from "./api";

const LOG = createLogger("result-list:ResultList");

export interface ResultListProps extends CommonComponentProps {
    columns: ColumnDef<ResultListData, unknown>[];
    data: ResultListData[];
}

export const ResultList: FC<ResultListProps> = (props) => {
    const { data, columns } = props;
    const { containerProps } = useCommonComponentProps("search", props);

    return (
        <ChakraProvider>
            <Box maxHeight="300px" overflowY="auto">
                <DataTable columns={columns} data={data} />
            </Box>
        </ChakraProvider>
    );
};
