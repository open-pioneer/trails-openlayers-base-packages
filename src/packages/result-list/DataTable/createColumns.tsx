// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { chakra } from "@chakra-ui/react";
import { BaseFeature } from "@open-pioneer/map";
import { PackageIntl } from "@open-pioneer/runtime";
import { createColumnHelper, Table as TanstackTable } from "@tanstack/react-table";
import { FormatOptions, ResultColumn, SelectionMode } from "../ResultList";
import { createSelectComponent } from "./SelectComponent";

export const SELECT_COLUMN_SIZE = 70;

const columnHelper = createColumnHelper<BaseFeature>();

export interface CreateColumnsOptions {
    columns: ResultColumn[];
    intl: PackageIntl;
    tableWidth?: number;
    formatOptions?: FormatOptions;
    selectionMode: SelectionMode;
    selectionStyle: "radio" | "checkbox";
    labelProperty?: string;
}

export function createColumns(options: CreateColumnsOptions) {
    const {
        columns,
        intl,
        tableWidth,
        formatOptions,
        selectionMode,
        selectionStyle,
        labelProperty
    } = options;
    const remainingColumnWidth: number | undefined =
        tableWidth === undefined ? undefined : calcRemainingColumnWidth(columns, tableWidth);
    const selectionColumn = createSelectionColumn(
        intl,
        selectionMode,
        selectionStyle,
        labelProperty
    );
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

    if (getPropertyValue == null && propertyName == null) {
        throw new Error(
            "Display columns are not yet implemented. You must either specify 'propertyName' or 'getPropertyValue'."
        );
    }

    return columnHelper.accessor(
        (feature: BaseFeature) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
                return defaultRenderCell(cellValue, intl, formatOptions);
            },
            header: column.displayName ?? column.propertyName,
            size: columnWidth
        }
    );
}

function defaultRenderCell(cellValue: unknown, intl: PackageIntl, formatOptions?: FormatOptions) {
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

function createSelectionColumn(
    intl: PackageIntl,
    selectionMode: SelectionMode,
    selectionStyle: "radio" | "checkbox",
    labelProperty?: string
) {
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
                    {createSelectComponent({
                        className: "result-list-select-all-checkbox",
                        toolTipLabel: getCheckboxTooltip(table, intl),
                        checked: table.getIsAllRowsSelected()
                            ? true
                            : table.getIsSomeRowsSelected()
                              ? "indeterminate"
                              : false,
                        onChange(newIsChecked) {
                            table.toggleAllRowsSelected(newIsChecked);
                        }
                    })}
                </chakra.div>
            );
        },
        cell: ({ row }) => {
            const className =
                selectionStyle === "radio"
                    ? "result-list-select-row-radio"
                    : "result-list-select-row-checkbox";
            const ariaLabel = intl.formatMessage(
                {
                    id: "ariaLabel.selectSingle"
                },
                { featureProperty: getLabel(row.original, labelProperty) }
            );
            return (
                <chakra.div
                    display="inline-block"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    className="result-list-select-row-container"
                >
                    {createSelectComponent({
                        mode: selectionStyle,
                        className,
                        checked: row.getIsSomeSelected() ? "indeterminate" : row.getIsSelected(),
                        disabled: !row.getCanSelect(),
                        onChange(newIsChecked) {
                            row.toggleSelected(newIsChecked);
                        },
                        ariaLabel: ariaLabel
                    })}
                </chakra.div>
            );
        }
    });
}

function getLabel(feature: BaseFeature, labelProperty: string | undefined) {
    if (labelProperty && feature.properties && feature.properties[labelProperty] != null) {
        return feature.properties[labelProperty].toString();
    }
    // use feature id as fallback if property not provided or does not exist for this feature
    return feature.id.toString();
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

function getCheckboxTooltip<Data>(table: TanstackTable<Data>, intl: PackageIntl) {
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
