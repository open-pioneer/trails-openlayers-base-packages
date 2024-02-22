// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    chakra,
    useToken
} from "@open-pioneer/chakra-integration";
import { createLogger } from "@open-pioneer/core";
import { BaseFeature } from "@open-pioneer/map";
import {
    ColumnDef,
    Header,
    HeaderGroup,
    SortDirection,
    Table as TanstackTable,
    flexRender
} from "@tanstack/react-table";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import React, { useEffect, useMemo, useState } from "react";
import { ColumnResizer } from "./ColumnResizer";
import { ColumnSortIndicator } from "./ColumnSortIndicator";
import { useSetupTable } from "./useSetupTable";
import { ResultListSelectionChangedEvent } from "../ResultList";
const LOG = createLogger("result-list:DataTable");

export interface DataTableProps<Data extends BaseFeature> {
    data: Data[];
    columns: ColumnDef<Data>[];
    onSelectionChanged?(event: ResultListSelectionChangedEvent): void;
}

export function DataTable<Data extends BaseFeature>(props: DataTableProps<Data>) {
    const intl = useIntl();
    const { table } = useSetupTable(props);
    const isResizing = !!table.getState().columnSizingInfo.isResizingColumn;
    const columnSizeVars = useColumnSizeVars(table);
    const [isClickBlocked, setIsClickBlocked] = useState(false);

    useEffect(() => {
        setIsClickBlocked(isResizing);
    }, [isResizing]);

    if (!table.getRowModel().rows.length) {
        return (
            <chakra.div className={"result-list-no-data-message"}>
                {intl.formatMessage({ id: "noDataMessage" })}
            </chakra.div>
        );
    }

    return (
        <Table
            className={classNames("result-list-table", {
                "result-list-table--is-resizing": isResizing
            })}
            style={columnSizeVars}
            width="99.9%"
            // An attempt to block click events while dragging the resize handle.
            // If the click event gets through, the user may accidentally trigger column sorting on mouse release
            onClickCapture={(e) => {
                if (isClickBlocked) {
                    LOG.debug("Blocking click event because resizing is active");
                    e.stopPropagation();
                    e.preventDefault();
                }
            }}
        >
            <Thead>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup} />
                ))}
            </Thead>
            {isResizing ? <MemoizedTableBody table={table} /> : <TableBody table={table} />}
        </Table>
    );
}

function TableHeaderGroup<Data>(props: { headerGroup: HeaderGroup<Data> }) {
    const { headerGroup } = props;
    const borderColor = useToken("colors", "trails.100");
    return (
        <Tr key={headerGroup.id} className="result-list-headers">
            {headerGroup.headers.map((header, index) => {
                return (
                    <TableHeader
                        key={header.id}
                        header={header}
                        index={index}
                        borderColor={borderColor}
                    />
                );
            })}
        </Tr>
    );
}

function TableHeader<Data>(props: {
    header: Header<Data, unknown>;
    index: number;
    borderColor: string;
}) {
    const { header, index, borderColor } = props;
    const width = `calc(var(--header-${header.id}-size) * 1px)`;
    return (
        <Th
            className="result-list-header"
            tabIndex={0}
            aria-sort={mapAriaSorting(header.column.getIsSorted())}
            onClick={() => header.column.getCanSort() && header.column.toggleSorting()}
            cursor={header.column.getCanSort() ? "pointer" : "unset"}
            style={{ width: index === 0 ? "50px" : width }}
            onKeyDown={(evt) => {
                if (evt.key === "Enter" && header.column.getCanSort()) {
                    header.column.toggleSorting(undefined);
                }
            }}
            /* use box shadow instead of border because it works better with position: sticky */
            border="none"
            boxShadow={`inset 0 -2px 0 0 ${borderColor}`}
            _focusVisible={{ textDecorationLine: "underline" }}
            _focus={{ outline: "none" }}
        >
            {flexRender(header.column.columnDef.header, header.getContext())}
            {header.column.getCanSort() && (
                <ColumnSortIndicator isSorted={header.column.getIsSorted()} />
            )}
            <ColumnResizer
                onDoubleClick={() => header.column.resetSize()}
                onMouseDown={header.getResizeHandler()}
                onTouchStart={header.getResizeHandler()}
                isResizing={header.column.getIsResizing()}
            />
        </Th>
    );
}

//un-memoized normal table body component - see memoized version below
function TableBody<Data extends object>({ table }: { table: TanstackTable<Data> }) {
    return (
        <Tbody className="result-list-table-body">
            {table.getRowModel().rows.map((row) => {
                return (
                    <Tr key={row.id} className="result-list-table-row">
                        {row.getVisibleCells().map((cell) => {
                            const width = `calc(var(--header-${cell.column.id}-size) * 1px)`;
                            return (
                                <Td
                                    key={cell.id}
                                    style={{ width: width }}
                                    className="result-list-table-row"
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </Td>
                            );
                        })}
                    </Tr>
                );
            })}
        </Tbody>
    );
}

// Special memoized wrapper for our table body that we will use during column resizing.
// See https://tanstack.com/table/v8/docs/framework/react/examples/column-resizing-performant
const MemoizedTableBody = React.memo(
    TableBody,
    (prev, next) => prev.table.options.data === next.table.options.data
) as typeof TableBody;

/**
 * Instead of calling `column.getSize()` on every render for every header
 * and especially every data cell (very expensive),
 * we will calculate all column sizes at once at the root table level in a useMemo
 * and pass the column sizes down as CSS variables to the <table> element.
 */
function useColumnSizeVars<Data>(table: TanstackTable<Data>) {
    const columnSizingInfo = table.getState().columnSizingInfo;
    const columnSizing = table.getState().columnSizing;
    const tableHeaders = table.getFlatHeaders();

    // Needs to be useMemo, not useEffect, to avoid multiple render calls?
    // Need to add columnSizingInfo to the dependency array to make resizing work
    return useMemo(() => {
        // Not used directly, but the memo must re-execute whenever this changes.
        // Not: columnSizing seems to be needed as well, because otherwise resetting the column size (header.column.resetSize())
        // won't to anything.
        void columnSizingInfo, columnSizing;
        const colSizes: { [key: string]: number } = {};
        for (let i = 0; i < tableHeaders.length; i++) {
            const header = tableHeaders[i]!;
            colSizes[`--header-${header.id}-size`] = header.getSize();
            colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
        }
        return colSizes;
    }, [tableHeaders, columnSizingInfo, columnSizing]);
}

type SortState = SortDirection | false;
function mapAriaSorting(sortState: SortState) {
    switch (sortState) {
        case "asc":
            return "ascending";
        case "desc":
            return "descending";
        default:
            return "none";
    }
}
