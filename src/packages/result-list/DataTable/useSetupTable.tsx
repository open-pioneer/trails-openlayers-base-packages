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

export function useSetupTable<Data extends BaseFeature>(props: DataTableProps<Data>) {
    const { data, columns } = props;
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState({});

    // if columns changes, everything should reset
    useEffect(() => {
        setRowSelection([]);
        setSorting([]);
    }, [columns]);

    // if data changes, selection should reset (maybe need to be more fine-grained)
    useEffect(() => {
        setRowSelection([]);
    }, [data]);

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
            sorting,
            rowSelection
        }
    });

    return { table, sorting, rowSelection };
}
