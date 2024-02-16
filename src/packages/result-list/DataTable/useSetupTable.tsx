// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from "react";
import {
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable
} from "@tanstack/react-table";
import { DataTableProps } from "./DataTable";
import { BaseFeature } from "@open-pioneer/map";
export function useSetupTable(props: DataTableProps<BaseFeature>) {
    const { data, columns, onSelectionChanged } = props;
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

    return { table, sorting };
}
