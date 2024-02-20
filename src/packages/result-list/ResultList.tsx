// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { BaseFeature } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "./DataTable/DataTable";
import { createColumns } from "./DataTable/createColumns";
import { ResultListSelectionChangedEvent } from "./api";

/**
 * Configures a column in the result list component.
 *
 * A column typically renders a property from the underlying feature.
 */
export interface ResultColumn {
    /**
     * Use this option to define an explicit column id.
     * This can be helpful to track your column when it moves in the table (for example, the sort order can be maintained).
     *
     * If this is not defined, {@link propertyName} will serve as a fallback.
     * If that is also not defined, the column index will be used instead.
     */
    id?: string;

    /**
     * The display name of this column.
     *
     * If no `displayName` has been configured, {@link propertyName} will serve as a fallback value.
     * If `propertyName` is also undefined, no column header will be rendered at all.
     */
    displayName?: string;

    /**
     * The width of this column, in pixels.
     */
    width?: number;

    /**
     * The property name to render.
     *
     * The value is expected to be available as `feature.properties[propertyName]`.
     *
     * See also {@link getPropertyValue}.
     */
    propertyName?: string;

    /**
     * Define this function to return a custom property value for this column.
     *
     * This can be used to create derived columns (by combining multiple properties into one value)
     * or to create columns for property that don't exist directly on the feature.
     *
     * The return value of this function will be rendered by the table.
     */
    getPropertyValue?: (feature: BaseFeature) => unknown;
}

/**
 * Configures the result list's content.
 */
export interface ResultListInput {
    /**
     * Configures the columns shown by the result list.
     */
    columns: ResultColumn[];

    /**
     * The data shown by the result list component.
     * Every feature will be rendered as an individual row.
     */
    data: BaseFeature[];
}

/**
 * Properties supported by the {@link ResultList} component.
 */
export interface ResultListProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId?: string;

    /**
     * Describes the data rendered by the component.
     */
    input: ResultListInput;

    /**
     * This handler is called whenever the user has changed the selected features in the result-list
     */
    onSelectionChanged?: (event: ResultListSelectionChangedEvent) => void;
}

/**
 * A component that displays a set of features as a list.
 */
export const ResultList: FC<ResultListProps> = (props) => {
    const { containerProps } = useCommonComponentProps("result-list", props);
    const intl = useIntl();
    const {
        input: { data, columns },
        onSelectionChanged
    } = props;
    if (columns.length === 0) {
        throw Error("No columns were defined. The result list cannot be displayed.");
    }

    const containerRef = useRef<HTMLDivElement>(null);
    const tableWidth = useTableWidth(containerRef);
    const dataTableColumns = useMemo(
        () => createColumns(columns, intl, tableWidth),
        [columns, intl, tableWidth]
    );

    return (
        <Box {...containerProps} height="100%" overflowY="auto" ref={containerRef}>
            <DataTable
                columns={dataTableColumns}
                data={data}
                onSelectionChanged={onSelectionChanged}
            />
        </Box>
    );
};

function useTableWidth(tableRef: RefObject<HTMLDivElement> | null) {
    const [tableWidth, setTableWidth] = useState<number>();

    useEffect(() => {
        if (!tableRef?.current) return;
        const resizeObserver = new ResizeObserver((event) => {
            // Depending on the layout, you may need to swap inlineSize with blockSize
            // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry/contentBoxSize
            const width = event[0]?.contentBoxSize[0]?.inlineSize;
            if (width != null) {
                setTableWidth(width);
            }
        });
        resizeObserver.observe(tableRef.current);
        return () => resizeObserver.disconnect();
    }, [tableRef]);
    return tableWidth;
}
