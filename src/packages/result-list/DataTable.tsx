// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    chakra,
    Checkbox
} from "@open-pioneer/chakra-integration";
import {
    useReactTable,
    flexRender,
    getCoreRowModel,
    ColumnDef,
    SortingState,
    getSortedRowModel,
    Table as TanstackTable
} from "@tanstack/react-table";
import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";

import React, { HTMLProps, useRef, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";

interface DataTableProps<Data extends object> {
    data: Data[];
    // eslint-disable-next-line
    columns: ColumnDef<Data, any>[];
}

export function DataTable<Data extends object>(props: DataTableProps<Data>) {
    const { data, columns } = props;
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState({});

    const selectColumn = createColumnHelper<Data>().display({
        id: "selection",
        size: 70
    });

    // TODO: full-width tables (100%) causes problems with cell sizes (maxSize not working...)
    //  --> need to distribute space manually? but then, no good window resizing possible....

    const [allColumns, setAllColumns] = useState<ColumnDef<Data>[]>([selectColumn, ...columns]);

    const table = useReactTable({
        columns: allColumns,
        data,
        columnResizeMode: "onChange",
        getCoreRowModel: getCoreRowModel(),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            rowSelection
        }
    });

    /**
     * Instead of calling `column.getSize()` on every render for every header
     * and especially every data cell (very expensive),
     * we will calculate all column sizes at once at the root table level in a useMemo
     * and pass the column sizes down as CSS variables to the <table> element.
     */
    const columnSizeVars = React.useMemo(() => {
        const headers = table.getFlatHeaders();
        const colSizes: { [key: string]: number } = {};
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i]!;
            colSizes[`--header-${header.id}-size`] = header.getSize();
            colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
        }
        return colSizes;
    }, [table.getState().columnSizingInfo]);

    return (
        <Table
            className={"result-list-table-element"}
            {...{
                style: { ...columnSizeVars },
                // 99% to avoid 1 pixel scrollbar
                width: "99%"
            }}
        >
            <Thead>
                {table.getHeaderGroups().map((headerGroup) => (
                    <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header, index) => {
                            // see https://tanstack.com/table/v8/docs/api/core/column-def#meta to type this correctly
                            // eslint-disable-next-line
                            const meta: any = header.column.columnDef.meta;
                            const width = `calc(var(--header-${header?.id}-size) * 1px)`;
                            return (
                                <>
                                    <Th
                                        key={header.id}
                                        onClick={header.column.getToggleSortingHandler()}
                                        isNumeric={meta?.isNumeric}
                                        style={{ width: index === 0 ? "50px" : width }}
                                    >
                                        {index === 0 ? (
                                            <>
                                                {
                                                    <IndeterminateCheckbox
                                                        {...{
                                                            checked: table.getIsAllRowsSelected(),
                                                            indeterminate:
                                                                table.getIsSomeRowsSelected(),
                                                            onChange:
                                                                table.getToggleAllRowsSelectedHandler()
                                                        }}
                                                    />
                                                }
                                                <chakra.span
                                                    onDoubleClick={() => header.column.resetSize()}
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    className={`resizer ${
                                                        header.column.getIsResizing()
                                                            ? "isResizing"
                                                            : ""
                                                    }`}
                                                ></chakra.span>
                                            </>
                                        ) : (
                                            <>
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                <chakra.span pl="4">
                                                    {header.column.getIsSorted() ? (
                                                        header.column.getIsSorted() === "desc" ? (
                                                            <TriangleDownIcon aria-label="sorted descending" />
                                                        ) : (
                                                            <TriangleUpIcon aria-label="sorted ascending" />
                                                        )
                                                    ) : null}
                                                </chakra.span>
                                                <chakra.span
                                                    onDoubleClick={() => header.column.resetSize()}
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    className={`resizer ${
                                                        header.column.getIsResizing()
                                                            ? "isResizing"
                                                            : ""
                                                    }`}
                                                ></chakra.span>
                                            </>
                                        )}
                                    </Th>
                                </>
                            );
                        })}
                    </Tr>
                ))}
            </Thead>
            {/* When resizing any column we will render this special memoized version of our table body */}
            {table.getState().columnSizingInfo.isResizingColumn ? (
                <MemoizedTableBody key={76548443} table={table}></MemoizedTableBody>
            ) : (
                <TableBody key={546756} table={table}></TableBody>
            )}
        </Table>
    );
}

function IndeterminateCheckbox({
    indeterminate,
    className = "",
    ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
    const ref = useRef<HTMLInputElement>(null!);
    return (
        <Checkbox
            ref={ref}
            className={className + " cursor-pointer"}
            isChecked={rest.checked}
            onChange={rest.onChange}
            isIndeterminate={indeterminate}
        ></Checkbox>
    );
}

//un-memoized normal table body component - see memoized version below
function TableBody<Data extends object>({ table }: { table: TanstackTable<Data> }) {
    return (
        <Tbody>
            {table.getRowModel().rows.map((row) => (
                <Tr key={row.id}>
                    <>
                        {row.getVisibleCells().map((cell, index) => {
                            // see https://tanstack.com/table/v8/docs/api/core/column-def#meta to type this correctly
                            // eslint-disable-next-line
                            const meta: any = cell.column.columnDef.meta;
                            const width = `calc(var(--header-${cell.column.id}-size) * 1px)`;
                            return (
                                <>
                                    <Td
                                        key={cell.id}
                                        isNumeric={meta?.isNumeric}
                                        style={{ width: width }}
                                    >
                                        {index === 0 ? (
                                            <IndeterminateCheckbox
                                                {...{
                                                    checked: row.getIsSelected(),
                                                    disabled: !row.getCanSelect(),
                                                    indeterminate: row.getIsSomeSelected(),
                                                    onChange: row.getToggleSelectedHandler()
                                                }}
                                            />
                                        ) : (
                                            <>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </>
                                        )}
                                    </Td>
                                </>
                            );
                        })}
                    </>
                </Tr>
            ))}
        </Tbody>
    );
}

//special memoized wrapper for our table body that we will use during column resizing
export const MemoizedTableBody = React.memo(
    TableBody,
    (prev, next) => prev.table.options.data === next.table.options.data
) as typeof TableBody;
