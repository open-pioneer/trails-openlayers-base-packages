// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Table, chakra, useToken } from "@chakra-ui/react";
import { Reactive, reactive } from "@conterra/reactivity-core";
import { createLogger } from "@open-pioneer/core";
import { BaseFeature } from "@open-pioneer/map";
import { useEvent } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
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
import { MouseEvent, createContext, useContext, useEffect, useMemo, useState } from "react";
import { ResultListSelectionChangeEvent, SelectionMode } from "../ResultList";
import { ColumnResizer } from "./ColumnResizer";
import { ColumnSortIndicator } from "./ColumnSortIndicator";
import { useSetupTable } from "./useSetupTable";
const LOG = createLogger("result-list:DataTable");

export interface DataTableProps<Data extends BaseFeature> {
    data: Data[];
    columns: ColumnDef<Data>[];
    memoizeRows: boolean;
    selectionMode: SelectionMode;
    onSelectionChange?(event: ResultListSelectionChangeEvent): void;
}

const TableContext = createContext<TableContext<unknown> | undefined>(undefined);

interface TableContext<Data> {
    /** The tanstack table instance. This object is stable. */
    table: TanstackTable<Data>;

    /** A signal to trigger re-rendering in the children of the chakra table. */
    forceRerender: Reactive<number>;
}

export function DataTable<Data extends BaseFeature>(props: DataTableProps<Data>) {
    const intl = useIntl();
    const { memoizeRows } = props;
    const { table } = useSetupTable(props); // NOTE: Triggers re-render often when table state changes!
    const isResizing = !!table.getState().columnSizingInfo.isResizingColumn;
    const useMemoOptimization = isResizing || memoizeRows;
    const columnSizeVars = useColumnSizeVars(table);

    const context = useMemo((): TableContext<Data> => {
        return {
            table,
            forceRerender: reactive(0)
        };
    }, [table]);
    context.forceRerender.value += 1; // Force rerendering of the TableContent child.

    // Block click events while dragging the resize handle.
    // If the click event gets through, the user may accidentally trigger column sorting on mouse release.
    // Note that this is in a useEffect() on purpose to defer "freeing" click events a bit.
    const [isClickBlocked, setIsClickBlocked] = useState(false);
    useEffect(() => {
        setIsClickBlocked(isResizing);
    }, [isResizing]);
    const blockClicksIfResizing = useEvent((e: MouseEvent) => {
        if (isClickBlocked) {
            LOG.debug("Blocking click event because resizing is active");
            e.stopPropagation();
            e.preventDefault();
        }
    });

    // We cache the table's root because chakra's table has some broken memo behavior: it recomputes
    // its styles and rerenders all all its children via context when some props change.
    // We keep both the props and the table's children as stable as possible.
    //
    // The table content instead uses a force rerender bypass via the `forceRerender` signal:
    // When react-table tells us to rerender, we trigger a rerender on our grandchild as well.
    const chakraTable = useMemo(() => {
        const content = <TableContent useMemo={useMemoOptimization} />;
        const chakraTable = (
            <Table.Root
                className="result-list-table"
                width="99.9%"
                onClickCapture={blockClicksIfResizing}
            >
                {content}
            </Table.Root>
        );
        return chakraTable;
    }, [blockClicksIfResizing, useMemoOptimization]);

    if (!table.getRowModel().rows.length) {
        return (
            <chakra.div className={"result-list-no-data-message"}>
                {intl.formatMessage({ id: "noDataMessage" })}
            </chakra.div>
        );
    }
    return (
        <chakra.div
            className={classNames("result-list-table-container", {
                "result-list-table-container--is-resizing": isResizing
            })}
            h="100%"
            w="100%"
            style={columnSizeVars}
        >
            <TableContext.Provider value={context as TableContext<unknown>}>
                {chakraTable}
            </TableContext.Provider>
        </chakra.div>
    );
}

function TableContent<Data extends BaseFeature>(props: { useMemo: boolean }) {
    const store = useContext(TableContext)! as TableContext<Data>;
    const table = store.table;

    // Hack to let the grandparent of this component force a rerender.
    useReactiveSnapshot(() => store.forceRerender.value, [store.forceRerender]);

    return (
        <>
            <Table.Header>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup} />
                ))}
            </Table.Header>
            <Table.Body className="result-list-table-body">
                {props.useMemo ? <MemoizedTableRows table={table} /> : <TableRows table={table} />}
            </Table.Body>
        </>
    );
}

function TableHeaderGroup<Data>(props: { headerGroup: HeaderGroup<Data> }) {
    const { headerGroup } = props;
    const borderColor = useToken("colors", "trails.100")[0] ?? "#000000";
    return (
        <Table.Row key={headerGroup.id} className="result-list-headers">
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
        </Table.Row>
    );
}

function TableHeader<Data>(props: {
    header: Header<Data, unknown>;
    index: number;
    borderColor: string;
}) {
    const { header, index, borderColor } = props;

    let width: string | undefined;
    let minWidth: string | undefined;
    if (index > 0) {
        width = `calc(var(--header-${header.id}-size) * 1px)`;
    } else {
        minWidth = "50px"; // Selection column
    }

    return (
        <Table.ColumnHeader
            className="result-list-header"
            fontWeight="semi-bold"
            tabIndex={0}
            aria-sort={mapAriaSorting(header.column.getIsSorted())}
            onClick={() => header.column.getCanSort() && header.column.toggleSorting()}
            cursor={header.column.getCanSort() ? "pointer" : "unset"}
            style={{ width, minWidth }}
            onKeyDown={(evt) => {
                if (evt.key === "Enter" && header.column.getCanSort()) {
                    header.column.toggleSorting(undefined);
                }
            }}
            /* use box shadow instead of border because it works better with position: sticky */
            border="none"
            boxShadow={`inset 0 -2px 0 0 ${borderColor}`}
            whiteSpace="nowrap" // prevent wrapping between header title and sort indicator
            userSelect="none"
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
        </Table.ColumnHeader>
    );
}

function TableRows<Data extends object>({ table }: { table: TanstackTable<Data> }) {
    return table.getRowModel().rows.map((row) => {
        return (
            <Table.Row key={row.id} className="result-list-table-row">
                {row.getVisibleCells().map((cell) => {
                    const width = `calc(var(--header-${cell.column.id}-size) * 1px)`;
                    return (
                        <Table.Cell
                            key={cell.id}
                            style={{ width: width }}
                            className="result-list-table-row"
                        >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Table.Cell>
                    );
                })}
            </Table.Row>
        );
    });
}

/**
 * Rows are memoized and only updating on changes due to sorting columns or selecting rows.
 * Removed full Memoization on Resizing because it does not have an additional effect.
 */
function MemoizedTableRows<Data extends object>({ table }: { table: TanstackTable<Data> }) {
    const memoizedRows = useMemo(() => {
        return <TableRows table={table} />;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table, table.getSortedRowModel().rows, table.getSelectedRowModel().rows]);
    return memoizedRows;
}

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
        // Note: columnSizing seems to be needed as well, because otherwise resetting the column size (header.column.resetSize())
        // won't to anything.
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
