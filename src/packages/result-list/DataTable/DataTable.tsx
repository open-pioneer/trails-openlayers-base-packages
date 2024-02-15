// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Table, Thead, Tbody, Tr, Th, Td } from "@open-pioneer/chakra-integration";
import {
    flexRender,
    ColumnDef,
    Table as TanstackTable,
    HeaderGroup,
    SortDirection,
    Column
} from "@tanstack/react-table";
import { useIntl } from "open-pioneer:react-hooks";
import React, { useMemo } from "react";
import { ColumnResizer, ColumnSortIndicator } from "./CustomComponents";
import { useSetupTable } from "./useSetupTable";

export interface DataTableProps<Data extends object> {
    data: Data[];
    columns: ColumnDef<Data>[];
}

export function DataTable<Data extends object>(props: DataTableProps<Data>) {
    const intl = useIntl();
    const { table } = useSetupTable(props);
    const columnSizeVars = useColumnSizeVars(table);

    if (!table.getRowModel().rows.length) {
        return (
            <div className={"result-list-no-data-message"}>
                {intl.formatMessage({ id: "noDataMessage" })}
            </div>
        );
    }

    return (
        <Table
            className={"result-list-table-element"}
            {...{
                style: { ...columnSizeVars },
                // 99.9% to avoid 1 pixel scrollbar
                width: "99.9%"
            }}
        >
            <Thead>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup} />
                ))}
            </Thead>
            {table.getState().columnSizingInfo.isResizingColumn ? (
                <MemoizedTableBody table={table}></MemoizedTableBody>
            ) : (
                <TableBody table={table}></TableBody>
            )}
        </Table>
    );
}

function TableHeaderGroup<Data>(props: { headerGroup: HeaderGroup<Data> }) {
    const { headerGroup } = props;

    return (
        <Tr key={headerGroup.id} className="result-list-header-tr">
            {headerGroup.headers.map((header, index) => {
                const width = `calc(var(--header-${header?.id}-size) * 1px)`;
                return (
                    <Th
                        className="result-list-th"
                        key={header.id}
                        tabIndex={0}
                        aria-label={getAriaLabelForColumn(header.column)}
                        aria-sort={mapAriaSorting(header.column.getIsSorted())}
                        onClick={() => header.column.getCanSort() && header.column.toggleSorting()}
                        cursor={header.column.getCanSort() ? "pointer" : "unset"}
                        style={{ width: index === 0 ? "50px" : width }}
                        onKeyDown={(evt) => {
                            if (evt.key === "Enter" && header.column.getCanSort()) {
                                header.column.toggleSorting(undefined);
                            }
                        }}
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
            })}
        </Tr>
    );
}

//un-memoized normal table body component - see memoized version below
function TableBody<Data extends object>({ table }: { table: TanstackTable<Data> }) {
    return (
        <Tbody className="result-list-table-body">
            {table.getRowModel().rows.map((row) => {
                return (
                    <Tr key={row.id} className="result-list-table-body-tr">
                        {row.getVisibleCells().map((cell) => {
                            const width = `calc(var(--header-${cell.column.id}-size) * 1px)`;
                            return (
                                <Td
                                    key={cell.id}
                                    style={{ width: width }}
                                    className="result-list-table-body-td"
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

// Workaround: This function removes the aria label for the select all column (IndeterminateCheckbox),
//      because otherwise it would be read twice due to a bug:
//      https://github.com/chakra-ui/chakra-ui/issues/8042
//      This is done by setting aria-label to a single space character. The empty string does not
//      seem to change the aria-label.
function getAriaLabelForColumn<Data>(column: Column<Data>) {
    return column.getCanSort() ? "" : " ";
}

//special memoized wrapper for our table body that we will use during column resizing
export const MemoizedTableBody = React.memo(
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
    const tableHeaders = table.getFlatHeaders();

    // Needs to be useMemo, not useEffect, to avoid multiple render calls?
    // Need to add columnSizingInfo to the dependency array to make resizing work
    return useMemo(() => {
        const colSizes: { [key: string]: number } = {};
        for (let i = 0; i < tableHeaders.length; i++) {
            const header = tableHeaders[i]!;
            colSizes[`--header-${header.id}-size`] = header.getSize();
            colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
        }
        return colSizes;
    }, [tableHeaders, columnSizingInfo]);
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
