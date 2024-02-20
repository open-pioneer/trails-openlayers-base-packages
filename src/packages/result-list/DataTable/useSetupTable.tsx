// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BaseFeature } from "@open-pioneer/map";
import {
    RowSelectionState,
    SortingState,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTableProps } from "./DataTable";

export function useSetupTable<Data extends BaseFeature>(props: DataTableProps<Data>) {
    const { data, columns } = props;
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    // Only sort by columns which actually exist
    const actualSort = useMemo(() => {
        return sorting.filter((sort) => columns.some((c) => c.id === sort.id));
    }, [sorting, columns]);

    const table = useReactTable({
        columns: columns,
        data,
        getRowId(feature) {
            return String(feature.id);
        },
        columnResizeMode: "onChange",
        getCoreRowModel: getCoreRowModel(),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting: actualSort,
            rowSelection
        }
    });

    return { table, sorting, rowSelection };
}
