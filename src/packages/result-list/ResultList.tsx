// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC, useMemo } from "react";
import { DataTable } from "./DataTable";
import { ResultListInput } from "./api";
import { createColumns } from "./createColumns";
import { useIntl } from "open-pioneer:react-hooks";
export interface ResultListProps extends CommonComponentProps {
    resultListInput: ResultListInput;
}

export const ResultList: FC<ResultListProps> = (props) => {
    const intl = useIntl();
    const { resultListInput } = props;
    const data = resultListInput.data;
    const metadata = resultListInput.metadata;

    if (metadata.length === 0) {
        throw Error(intl.formatMessage({ id: "illegalArgumentException" }));
    }

    // TODO: Remove test data
    //const data = dummyFeatureData;
    const { containerProps } = useCommonComponentProps("result-list", props);
    const columns = useMemo(() => createColumns(metadata), [metadata]);

    return (
        <Box {...containerProps} height="100%" overflowY="auto">
            <DataTable columns={columns} data={data} />
        </Box>
    );
};
