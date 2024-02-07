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
    Checkbox,
    Tooltip
} from "@open-pioneer/chakra-integration";
import {
    useReactTable,
    flexRender,
    getCoreRowModel,
    ColumnDef,
    SortingState,
    getSortedRowModel,
    Table as TanstackTable,
    SortDirection
} from "@tanstack/react-table";
import { TriangleDownIcon, TriangleUpIcon, UpDownIcon } from "@chakra-ui/icons";
import { useIntl } from "open-pioneer:react-hooks";
import React, { HTMLProps, useMemo, useRef, useState } from "react";
import { PackageIntl } from "@open-pioneer/runtime";

interface DataTableProps<Data extends object> {
    data: Data[];
    columns: ColumnDef<Data, unknown>[];
}

export function DataTable<Data extends object>(props: DataTableProps<Data>) {
    const intl = useIntl();
    const { data, columns } = props;
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState({});

    const table = useReactTable({
        columns: columns,
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

    const columnSizeVars = useColumnSizeVars(table);

    function getCheckboxToolTip() {
        if (Object.keys(rowSelection).length === table.getRowModel().rows.length) {
            return intl.formatMessage({ id: "deSelectAllTooltip" });
        } else {
            return intl.formatMessage({ id: "selectAllTooltip" });
        }
    }

    if (!table.getRowModel().rows.length) {
        return (
            <div className={"no-data-message"}>{intl.formatMessage({ id: "noDataMessage" })}</div>
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
                    <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header, index) => {
                            const width = `calc(var(--header-${header?.id}-size) * 1px)`;
                            return (
                                <Th
                                    key={header.id}
                                    onClick={header.column.getToggleSortingHandler()}
                                    style={{ width: index === 0 ? "50px" : width }}
                                >
                                    {index === 0 ? (
                                        <IndeterminateCheckbox
                                            {...{
                                                className: "result-list-select-all-checkbox",
                                                checked: table.getIsAllRowsSelected(),
                                                indeterminate: table.getIsSomeRowsSelected(),
                                                onChange: table.getToggleAllRowsSelectedHandler(),
                                                toolTipLabel: getCheckboxToolTip(),
                                                // TODO: Is also read by screenreader for all single row select checkboxes?!
                                                ariaLabel: intl.formatMessage({
                                                    id: "ariaLabel.selectAll"
                                                })
                                            }}
                                        />
                                    ) : (
                                        <>
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                            <ColumnSorter
                                                toggleSorting={() =>
                                                    header.column.toggleSorting(undefined)
                                                }
                                                isSorted={header.column.getIsSorted()}
                                                ariaLabel={getSortingAriaLabel(
                                                    intl,
                                                    header.column.getIsSorted()
                                                )}
                                            />
                                        </>
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
                ))}
            </Thead>
            {/* When resizing any column we will render this special memoized version of our table body */}
            {table.getState().columnSizingInfo.isResizingColumn ? (
                <MemoizedTableBody table={table}></MemoizedTableBody>
            ) : (
                <TableBody table={table}></TableBody>
            )}
        </Table>
    );
}

/**
 * Instead of calling `column.getSize()` on every render for every header
 * and especially every data cell (very expensive),
 * we will calculate all column sizes at once at the root table level in a useMemo
 * and pass the column sizes down as CSS variables to the <table> element.
 */
function useColumnSizeVars<Data>(table: TanstackTable<Data>) {
    const columnSizingInfo = table.getState().columnSizingInfo;
    const tableHeaders = table.getFlatHeaders();

    // TODO: Needs to be useMemo, not useEffect, to avoid multiple render calls?
    // Need to add columnSizingInfo to the dependency array to make resizing work
    const columnSizeVars = useMemo(() => {
        const colSizes: { [key: string]: number } = {};
        for (let i = 0; i < tableHeaders.length; i++) {
            const header = tableHeaders[i]!;
            colSizes[`--header-${header.id}-size`] = header.getSize();
            colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
        }
        return colSizes;
    }, [tableHeaders, columnSizingInfo]);

    return columnSizeVars;
}

type SortState = SortDirection | false;
function getSortingAriaLabel(intl: PackageIntl, sortState: SortState) {
    switch (sortState) {
        case "asc":
            return intl.formatMessage({
                id: "ariaLabel.sortAscending"
            });
        case "desc":
            return intl.formatMessage({
                id: "ariaLabel.sortDescending"
            });
        case false:
            return intl.formatMessage({
                id: "ariaLabel.sortInitial"
            });
    }
}

function IndeterminateCheckbox({
    indeterminate,
    className = "",
    toolTipLabel,
    ...rest
}: {
    indeterminate?: boolean;
    toolTipLabel?: string;
    ariaLabel: string;
} & HTMLProps<HTMLInputElement>) {
    const ref = useRef<HTMLInputElement>(null!);
    return (
        <Tooltip {...{}} label={toolTipLabel} placement="right" shouldWrapChildren={true}>
            <Checkbox
                ref={ref}
                aria-label={rest.ariaLabel}
                className={className + " cursor-pointer"}
                isChecked={rest.checked}
                onChange={rest.onChange}
                isIndeterminate={indeterminate}
            ></Checkbox>
        </Tooltip>
    );
}
function ColumnSorter(props: {
    toggleSorting: () => void;
    isSorted: boolean | SortDirection;
    ariaLabel: string;
}): JSX.Element {
    const { toggleSorting, isSorted, ariaLabel } = props;

    return (
        <chakra.span
            ml="4"
            tabIndex={0}
            className="result-list-sort-icon"
            aria-label={ariaLabel}
            onKeyDown={(evt) => {
                const key = evt.key;
                if (key === "Enter") {
                    toggleSorting();
                }
            }}
        >
            {isSorted ? (
                isSorted === "desc" ? (
                    <TriangleDownIcon />
                ) : (
                    <TriangleUpIcon />
                )
            ) : (
                <UpDownIcon className="result-list-sort-initial-icon" />
            )}
        </chakra.span>
    );
}

function ColumnResizer(props: {
    onDoubleClick: () => void;
    onMouseDown: (event: unknown) => void;
    onTouchStart: (event: unknown) => void;
    isResizing: boolean;
}): JSX.Element {
    const { onDoubleClick, onMouseDown, onTouchStart, isResizing } = props;
    const className = `resizer ${isResizing ? "isResizing" : ""}`;
    return (
        <chakra.span
            onDoubleClick={onDoubleClick}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className={className}
        ></chakra.span>
    );
}

//un-memoized normal table body component - see memoized version below
function TableBody<Data extends object>({ table }: { table: TanstackTable<Data> }) {
    const intl = useIntl();
    return (
        <Tbody>
            {table.getRowModel().rows.map((row) => {
                return (
                    <Tr key={row.id}>
                        {row.getVisibleCells().map((cell, index) => {
                            const width = `calc(var(--header-${cell.column.id}-size) * 1px)`;
                            return (
                                <Td key={cell.id} style={{ width: width }}>
                                    {index === 0 ? (
                                        <IndeterminateCheckbox
                                            {...{
                                                className: "result-list-select-row-checkbox",
                                                checked: row.getIsSelected(),
                                                disabled: !row.getCanSelect(),
                                                indeterminate: row.getIsSomeSelected(),
                                                onChange: row.getToggleSelectedHandler(),
                                                ariaLabel: intl.formatMessage({
                                                    id: "ariaLabel.selectSingle"
                                                })
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
                            );
                        })}
                    </Tr>
                );
            })}
        </Tbody>
    );
}

//special memoized wrapper for our table body that we will use during column resizing
export const MemoizedTableBody = React.memo(
    TableBody,
    (prev, next) => prev.table.options.data === next.table.options.data
) as typeof TableBody;
