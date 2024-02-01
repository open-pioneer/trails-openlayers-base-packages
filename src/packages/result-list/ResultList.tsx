// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC, useEffect, useMemo, useRef, useState } from "react";
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

    const dataTableRef = useRef<HTMLDivElement>(null);
    const [tableWidth, setTableWidth] = useState(0);

    useEffect(() => {
        if (!dataTableRef.current) return;
        const resizeObserver = new ResizeObserver((event) => {
            // Depending on the layout, you may need to swap inlineSize with blockSize
            // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry/contentBoxSize
            if (event[0] === undefined || event[0].contentBoxSize[0] === undefined) return;
            setTableWidth(event[0].contentBoxSize[0].inlineSize);
        });
        resizeObserver.observe(dataTableRef.current);
    }, [dataTableRef]);

    const { containerProps } = useCommonComponentProps("result-list", props);
    const columns = useMemo(() => createColumns(metadata, tableWidth), [metadata, tableWidth]);

    return (
        <Box {...containerProps} height="100%" overflowY="auto" ref={dataTableRef}>
            <DataTable columns={columns} data={data} tableWidth={tableWidth} />
        </Box>
    );
};
