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
import { useEffect, useMemo, useState } from "react";
import { DataTableProps } from "./DataTable";

export function useSetupTable<Data extends BaseFeature>(props: DataTableProps<Data>) {
    const { data, columns, onSelectionChanged } = props;
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

    /**
     * On every selection-change throw change-Event with selected Features
     */
    useEffect(() => {
        const selectedRows = table.getSelectedRowModel();
        const features = selectedRows.rows.map((feature) => feature.original);
        if (onSelectionChanged)
            onSelectionChanged({
                features: features,
                getFeatureIds: () => {
                    return features.map((feature: BaseFeature) => feature.id);
                }
            });
    }, [rowSelection, table, onSelectionChanged]);

    return { table, sorting, rowSelection };
}
