// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BaseFeature } from "@open-pioneer/map";
import { useEvent } from "@open-pioneer/react-utils";
import {
    RowSelectionState,
    SortingState,
    Updater,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { usePrevious } from "react-use";
import { DataTableProps } from "./DataTable";

export function useSetupTable<Data extends BaseFeature>(props: DataTableProps<Data>) {
    const { data, columns, onSelectionChange: onSelectionChange, selectionMode } = props;
    const [sorting, setSorting] = useState<SortingState>([]);
    const previousSelectionMode = usePrevious(props.selectionMode);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    // Only sort by columns which actually exist
    const actualSort = useMemo(() => {
        return sorting.filter((sort) => columns.some((c) => c.id === sort.id));
    }, [sorting, columns]);

    const updateSelection = useEvent((updaterOrValue: Updater<RowSelectionState>) => {
        const newSelection = applyUpdate(rowSelection, updaterOrValue);
        if (newSelection === rowSelection) {
            return;
        }

        setRowSelection(newSelection);

        if (onSelectionChange) {
            const rowsById = table.getCoreRowModel().rowsById;
            const selectedFeatures: BaseFeature[] = [];
            for (const rowId of Object.keys(newSelection)) {
                if (!newSelection[rowId]) {
                    continue;
                }

                const row = rowsById[rowId];
                if (!row) {
                    continue;
                }

                selectedFeatures.push(row.original);
            }

            onSelectionChange({
                features: selectedFeatures,
                getFeatureIds: () => {
                    return selectedFeatures.map((feature: BaseFeature) => feature.id);
                }
            });
        }
    });

    const table = useReactTable({
        columns: columns,
        data,
        getRowId(feature) {
            return String(feature.id);
        },
        columnResizeMode: "onChange",
        getCoreRowModel: getCoreRowModel(),
        enableRowSelection: true,
        enableMultiRowSelection: selectionMode === "multi",
        onRowSelectionChange: updateSelection,
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting: actualSort,
            rowSelection
        }
    });

    useEffect(() => {
        if (previousSelectionMode && selectionMode !== previousSelectionMode) {
            table.resetRowSelection();
        }
    }, [table, previousSelectionMode, selectionMode]);

    return { table, sorting, rowSelection };
}

function applyUpdate<T>(current: T, updaterOrValue: Updater<T>): T {
    if (typeof updaterOrValue === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (updaterOrValue as any)(current);
    }
    return updaterOrValue;
}
