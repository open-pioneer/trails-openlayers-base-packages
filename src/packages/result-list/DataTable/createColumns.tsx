// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { chakra } from "@open-pioneer/chakra-integration";
import { BaseFeature } from "@open-pioneer/map";
import { PackageIntl } from "@open-pioneer/runtime";
import { createColumnHelper } from "@tanstack/react-table";
import { Table as TanstackTable } from "@tanstack/table-core/build/lib/types";
import { SelectCheckbox } from "./SelectCheckbox";
import { ResultColumn } from "../ResultList";

export const SELECT_COLUMN_SIZE = 70;
const columnHelper = createColumnHelper<BaseFeature>();

export function createColumns(columns: ResultColumn[], intl: PackageIntl, tableWidth?: number) {
    const remainingColumnWidth: number | undefined =
        tableWidth === undefined ? undefined : calcRemainingColumnWidth(columns, tableWidth);
    const selectionColumn = createSelectionColumn(intl);
    const columnDefs = columns.map((column, index) => {
        const columnWidth = column.width || remainingColumnWidth;
        const configuredId = column.id ?? column.propertyName ?? String(index);
        return createColumn(column, columnWidth, "result-list-col_" + configuredId);
    });
    return [selectionColumn, ...columnDefs];
}

function createColumn(column: ResultColumn, columnWidth: number | undefined, id: string) {
    const { propertyName, getPropertyValue } = column;
    const hasPropertyValue = getPropertyValue != null || propertyName != null;

    // TODO: Another issue
    if (!hasPropertyValue) {
        throw new Error(
            "Display columns are not yet implemented. You must either specify 'propertyName' or 'getPropertyValue'."
        );
    }

    return columnHelper.accessor(
        (feature: BaseFeature) => {
            return getPropertyValue?.(feature) ?? feature.properties?.[propertyName!];
        },
        {
            id: id,
            cell: (info) => {
                const cellValue = info.getValue();
                if (cellValue == null) {
                    return "";
                }
                return String(cellValue);
            },
            header: column.displayName ?? column.propertyName,
            size: columnWidth
        }
    );
}

function createSelectionColumn(intl: PackageIntl) {
    return columnHelper.display({
        id: "selection-buttons",
        size: SELECT_COLUMN_SIZE,
        enableSorting: false,
        header: ({ table }) => {
            return (
                <chakra.div
                    display="inline-block"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    className="result-list-select-all-checkbox-container"
                >
                    <SelectCheckbox
                        className="result-list-select-all-checkbox"
                        isChecked={table.getIsAllRowsSelected()}
                        isIndeterminate={table.getIsSomeRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                        toolTipLabel={getCheckboxToolTip(table, intl)}
                    />
                </chakra.div>
            );
        },
        cell: ({ row }) => {
            return (
                <chakra.div
                    display="inline-block"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    className="result-list-select-row-checkbox-container"
                >
                    <SelectCheckbox
                        className="result-list-select-row-checkbox"
                        isChecked={row.getIsSelected()}
                        isDisabled={!row.getCanSelect()}
                        isIndeterminate={row.getIsSomeSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        ariaLabel={intl.formatMessage({
                            id: "ariaLabel.selectSingle"
                        })}
                    />
                </chakra.div>
            );
        }
    });
}

function calcRemainingColumnWidth(
    columns: ResultColumn[],
    tableWidth: number,
    selectColumnWidth: number = SELECT_COLUMN_SIZE
) {
    const fullWidth = columns.reduce((sum, column) => (column.width ?? 0) + sum, 0);
    const undefinedWidthCount = columns.reduce(
        (sum, column) => (column.width === undefined ? sum + 1 : sum),
        0
    );
    const remainingWidth = tableWidth - selectColumnWidth - fullWidth;
    return remainingWidth / undefinedWidthCount;
}

function getCheckboxToolTip<Data>(table: TanstackTable<Data>, intl: PackageIntl) {
    if (table.getIsAllRowsSelected()) {
        return intl.formatMessage({ id: "deSelectAllTooltip" });
    } else {
        return intl.formatMessage({ id: "selectAllTooltip" });
    }
}
