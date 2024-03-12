// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BaseFeature, useMapModel } from "@open-pioneer/map";
import { useEvent } from "@open-pioneer/react-utils";
import {
    RowSelectionState,
    SortingState,
    Updater,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTableProps } from "./DataTable";

export function useSetupTable<Data extends BaseFeature>(props: DataTableProps<Data>) {
    const { mapId, data, columns, onSelectionChange: onSelectionChange } = props;
    const { map } = useMapModel(mapId);
    const [sorting, setSorting] = useState<SortingState>([]);
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
            map?.highlight(selectedFeatures);

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
        onRowSelectionChange: updateSelection,
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting: actualSort,
            rowSelection
        }
    });

    return { table, sorting, rowSelection };
}

function applyUpdate<T>(current: T, updaterOrValue: Updater<T>): T {
    if (typeof updaterOrValue === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (updaterOrValue as any)(current);
    }
    return updaterOrValue;
}
