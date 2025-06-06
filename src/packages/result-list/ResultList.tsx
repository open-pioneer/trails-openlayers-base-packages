// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    BaseFeature,
    HighlightOptions,
    MapModelProps,
    useMapModel,
    ZoomOptions
} from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, ReactNode, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "./DataTable/DataTable";
import { createColumns } from "./DataTable/createColumns";
import { FormatNumberOptions } from "@formatjs/intl";
import { Box } from "@chakra-ui/react";

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
     *
     * It is recommended to specify an id, if no {@link propertyName} has been set, because the
     * column index fallback is not advised.
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

    /** Custom render function to render a table cell in this column. */
    renderCell?: (context: RenderCellContext) => ReactNode;
}

/**
 * The arguments passed to {@link ResultColumn.renderCell | renderCell}.
 */
export interface RenderCellContext {
    /**
     * The feature in this row.
     */
    feature: BaseFeature;

    /**
     * The value of this column.
     * May be undefined if neither `propertyName` nor `getPropertyValue` was specified on the column.
     */
    value: unknown;
}

/**
 * To specify the format of cell values if they are of number or date type.
 */
export interface FormatOptions {
    /**
     * To specify the format of number type values
     */
    numberOptions?: FormatNumberOptions;
    /**
     *  To specify the format of date type values
     */
    dateOptions?: Intl.DateTimeFormatOptions;
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
     * Property of the features in the result list that is used to enrich aria labels with context.
     *
     * The feature's id is used by default or as fallback if this option is not configured or the
     * property does not exist on the feature.
     */
    labelProperty?: string;

    /**
     * The data shown by the result list component.
     * Every feature will be rendered as an individual row.
     */
    data: BaseFeature[];

    /**
     * Optional formatOptions to specify the `numberOptions` for number type values and
     * `dateOptions` to specify the format of date type values
     */
    formatOptions?: FormatOptions;
}

/**
 * Emitted when the selection within the ResultList changes.
 */
export interface ResultListSelectionChangeEvent {
    features: BaseFeature[];
    getFeatureIds: () => (number | string)[];
}

/**
 * Specifies whether it should be possible to select multiple or only single rows.
 */
export type SelectionMode = "multi" | "single";

/**
 * Properties supported by the {@link ResultList} component.
 */
export interface ResultListProps extends CommonComponentProps, MapModelProps {
    /**
     * Describes the data rendered by the component.
     */
    input: ResultListInput;

    /**
     * The selection mode used by the result list. Defaults to `"multi"`.
     */
    selectionMode?: SelectionMode;

    /**
     * The style used for the selection controls in a row.
     * Defaults to `"checkbox"` if `selectionMode` is `"multi"`, or `"radio"` if `selectionMode` is `"single"`.
     *
     * Note: `"radio"` can not be used together with multi selection.
     */
    selectionStyle?: "radio" | "checkbox";

    /**
     * This handler is called whenever the user has changed the selected features in the result-list.
     */
    onSelectionChange?: (event: ResultListSelectionChangeEvent) => void;

    /**
     * Specifies if the map should zoom to features when they are loaded into the result-list. Defaults to true.
     */
    enableZoom?: boolean;

    /**
     * Should data be highlighted in the map. Default true.
     */
    enableHighlight?: boolean;

    /**
     * Optional styling option
     */
    highlightOptions?: HighlightOptions;

    /**
     * Optional zooming options
     */
    zoomOptions?: ZoomOptions;

    /**
     * Should each row be memoized to improve render performance. Default `false`.
     */
    memoizeRows?: boolean;
}

/**
 * A component that displays a set of features as a list.
 */
export const ResultList: FC<ResultListProps> = (props) => {
    const { containerProps } = useCommonComponentProps("result-list", props);
    const intl = useIntl();
    const {
        input: { data, columns, labelProperty, formatOptions },
        memoizeRows = false,
        onSelectionChange,
        enableZoom = true,
        zoomOptions,
        enableHighlight = true,
        selectionMode = "multi",
        selectionStyle = selectionMode === "single" ? "radio" : "checkbox",
        highlightOptions
    } = props;

    const { map } = useMapModel(props);

    if (columns.length === 0) {
        throw Error("No columns were defined. The result list cannot be displayed.");
    }

    if (selectionMode === "multi" && selectionStyle === "radio") {
        throw new Error("Cannot mix multi selection with selectionStyle 'radio'.");
    }

    const containerRef = useRef<HTMLDivElement>(null);
    const tableWidth = useTableWidth(containerRef);
    const dataTableColumns = useMemo(
        () =>
            createColumns({
                columns: columns,
                intl: intl,
                tableWidth: tableWidth,
                formatOptions: formatOptions,
                selectionMode,
                selectionStyle,
                labelProperty
            }),
        [columns, intl, tableWidth, formatOptions, selectionMode, selectionStyle, labelProperty]
    );

    useEffect(() => {
        if (!map) {
            return;
        }
        if (enableZoom) {
            map.zoom(data, zoomOptions);
        }

        if (enableHighlight) {
            const highlight = map.highlight(data, highlightOptions);
            return () => highlight.destroy();
        }
    }, [map, data, zoomOptions, enableZoom, enableHighlight, highlightOptions]);

    return (
        <Box {...containerProps} height="100%" overflowY="auto" ref={containerRef}>
            <DataTable
                columns={dataTableColumns}
                data={data}
                memoizeRows={memoizeRows}
                selectionMode={selectionMode}
                onSelectionChange={onSelectionChange}
            />
        </Box>
    );
};

function useTableWidth(tableRef: RefObject<HTMLDivElement | null>) {
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
