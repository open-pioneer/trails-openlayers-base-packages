// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createColumnHelper } from "@tanstack/react-table";
import { ResultColumn } from "./api";
import { BaseFeature } from "@open-pioneer/map/api/BaseFeature";
import { IndeterminateCheckbox } from "./DataTable/CustomComponents";
import { chakra } from "@open-pioneer/chakra-integration";
import { PackageIntl } from "@open-pioneer/runtime";
import { Table as TanstackTable } from "@tanstack/table-core/build/lib/types";

const columnHelper = createColumnHelper<BaseFeature>();
export const SELECT_COLUMN_SIZE = 70;

export function createColumns(metaData: ResultColumn[], intl: PackageIntl, tableWidth?: number) {
    const remainingColumnWidth: number | undefined =
        tableWidth === undefined ? undefined : calcRemainingColumnWidth(metaData, tableWidth);
    const selectionColumn = createSelectionColumn(intl);
    const columnDef = metaData.map((metaDataItem, index) => {
        const columnWidth = metaDataItem.width || remainingColumnWidth;
        return createColumn(metaDataItem, columnWidth, "result-list-col_" + index);
    });
    return [selectionColumn, ...columnDef];
}

function createColumn(metaDataItem: ResultColumn, columnWidth: number | undefined, id: string) {
    const { propertyName, getPropertyValue } = metaDataItem;
    return columnHelper.accessor(
        (feature: BaseFeature) => {
            return getPropertyValue?.(feature) ?? feature.properties?.[propertyName];
        },
        // Todo Formatting of attributes #241
        {
            id: id,
            cell: (info) => {
                let cellValue =
                    getPropertyValue?.(info.row.original) ??
                    info.row.original.properties?.[propertyName];
                if (cellValue === undefined) cellValue = "";
                return String(cellValue);
            },
            header: metaDataItem.displayName,
            size: columnWidth
        }
    );
}

function createSelectionColumn(intl: PackageIntl) {
    return columnHelper.display({
        id: "result-list-col_selection-buttons",
        size: SELECT_COLUMN_SIZE,
        header: ({ table }) => {
            return (
                <IndeterminateCheckbox
                    {...{
                        className: "result-list-select-all-checkbox",
                        checked: table.getIsAllRowsSelected(),
                        indeterminate: table.getIsSomeRowsSelected(),
                        onChange: table.getToggleAllRowsSelectedHandler(),
                        toolTipLabel: getCheckboxToolTip(table, intl),
                        ariaLabel: intl.formatMessage({
                            id: "ariaLabel.selectAll"
                        })
                    }}
                />
            );
        },
        cell: ({ row }) => {
            return (
                <chakra.div
                    display="inline-block"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <IndeterminateCheckbox
                        {...{
                            className: "result-list-select-row-checkbox",
                            checked: row.getIsSelected(),
                            disabled: !row.getCanSelect(),
                            indeterminate: row.getIsSomeSelected(),
                            onChange: row.getToggleSelectedHandler(),
                            ariaLabel: intl.formatMessage({
                                id: "ariaLabel.selectSingle"
                            })
                        }}
                    />
                </chakra.div>
            );
        }
    });
}

function calcRemainingColumnWidth(
    metaData: ResultColumn[],
    tableWidth: number,
    selectColumnWidth: number = SELECT_COLUMN_SIZE
) {
    const fullWidth = metaData.reduce((sum, metaDataItem) => (metaDataItem.width ?? 0) + sum, 0);
    const undefinedWidthCount = metaData.reduce(
        (sum, metaDataItem) => (metaDataItem.width === undefined ? sum + 1 : sum),
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
