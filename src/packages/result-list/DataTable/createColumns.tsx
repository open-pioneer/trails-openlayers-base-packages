// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { chakra, Radio } from "@open-pioneer/chakra-integration";
import { BaseFeature } from "@open-pioneer/map";
import { PackageIntl } from "@open-pioneer/runtime";
import { createColumnHelper } from "@tanstack/react-table";
import { Table as TanstackTable } from "@tanstack/table-core/build/lib/types";
import { FormatOptions, ResultColumn } from "../ResultList";
import { SelectCheckbox } from "./SelectCheckbox";
import { SelectionMode } from "../ResultList";

export const SELECT_COLUMN_SIZE = 70;

const columnHelper = createColumnHelper<BaseFeature>();

export interface CreateColumnsOptions {
    columns: ResultColumn[];
    intl: PackageIntl;
    selectionMode: SelectionMode;
    tableWidth?: number;
    formatOptions?: FormatOptions;
}

export function createColumns(options: CreateColumnsOptions) {
    const { columns, intl, tableWidth, formatOptions, selectionMode } = options;
    const remainingColumnWidth: number | undefined =
        tableWidth === undefined ? undefined : calcRemainingColumnWidth(columns, tableWidth);
    const selectionColumn = createSelectionColumn(intl, selectionMode);
    const columnDefs = columns.map((column, index) => {
        const columnWidth = column.width || remainingColumnWidth;
        const configuredId =
            column.id || (column.propertyName && slug(column.propertyName)) || String(index);
        return createColumn({
            id: "result-list-col_" + configuredId,
            column: column,
            intl: intl,
            columnWidth: columnWidth,
            formatOptions: formatOptions
        });
    });
    return [selectionColumn, ...columnDefs];
}

interface CreateColumnOptions {
    id: string;
    column: ResultColumn;
    intl: PackageIntl;
    columnWidth?: number;
    formatOptions?: FormatOptions;
}

function createColumn(options: CreateColumnOptions) {
    const { id, column, columnWidth, formatOptions, intl } = options;
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
                if (column.renderCell) {
                    return column.renderCell({
                        feature: info.row.original,
                        value: cellValue
                    });
                }
                return renderFunc(cellValue, intl, formatOptions);
            },
            header: column.displayName ?? column.propertyName,
            size: columnWidth
        }
    );
}

function renderFunc(cellValue: unknown, intl: PackageIntl, formatOptions?: FormatOptions) {
    if (cellValue === null || cellValue === undefined) return "";
    const type = typeof cellValue;
    const formatNumber = (num: number | bigint) => {
        if (Number.isNaN(num)) return "";
        return intl.formatNumber(num, formatOptions?.numberOptions);
    };

    switch (type) {
        case "number": {
            return formatNumber(cellValue as number);
        }
        case "bigint": {
            return formatNumber(cellValue as bigint);
        }
        case "boolean": {
            return intl.formatMessage({ id: `displayBoolean.${cellValue}` });
        }
        case "string": {
            return cellValue as string;
        }
        case "object": {
            if (cellValue instanceof Date)
                return intl.formatDate(cellValue, formatOptions?.dateOptions);
            return cellValue.toString();
        }
        default:
            return String(cellValue);
    }
}

function createSelectionColumn(intl: PackageIntl, selectionMode: SelectionMode) {
    return columnHelper.display({
        id: "selection-buttons",
        size: SELECT_COLUMN_SIZE,
        enableSorting: false,
        header: ({ table }) => {
            if (selectionMode !== "multi") return;
            return (
                <chakra.div
                    display="inline-block"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    className="result-list-select-all-container"
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
            const selectComp =
                selectionMode === "single" ? (
                    <Radio
                        name={row.id}
                        className="result-list-select-row-radio"
                        isChecked={row.getIsSelected()}
                        isDisabled={!row.getCanSelect()}
                        onChange={row.getToggleSelectedHandler()}
                        aria-label={intl.formatMessage({
                            id: "ariaLabel.selectSingle"
                        })}
                    />
                ) : (
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
                );
            return (
                <chakra.div
                    display="inline-block"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    className="result-list-select-row-container"
                >
                    {selectComp}
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

function slug(id: string) {
    return id
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
