// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HTMLProps, useRef } from "react";
import { Checkbox, Tooltip, chakra } from "@open-pioneer/chakra-integration";
import { SortDirection } from "@tanstack/react-table";
import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";

export function IndeterminateCheckbox({
    indeterminate,
    className = "",
    toolTipLabel,
    ...rest
}: {
    indeterminate?: boolean;
    toolTipLabel?: string;
    ariaLabel?: string;
} & HTMLProps<HTMLInputElement>) {
    const ref = useRef<HTMLInputElement>(null!);
    const checkboxComponent = (
        <Checkbox
            aria-label={rest.ariaLabel}
            tabIndex={0}
            ref={ref}
            className={className + " cursor-pointer"}
            isChecked={rest.checked}
            onChange={rest.onChange}
            isIndeterminate={indeterminate}
        ></Checkbox>
    );
    return toolTipLabel ? (
        <Tooltip {...{}} className={className + "_tooltip"} label={toolTipLabel} placement="right">
            {checkboxComponent}
        </Tooltip>
    ) : (
        checkboxComponent
    );
}

export function ColumnSortIndicator(props: { isSorted: false | SortDirection }): JSX.Element {
    const { isSorted } = props;

    return (
        <chakra.span ml="4" className="result-list-sort-indicator">
            {isSorted ? isSorted === "desc" ? <TriangleDownIcon /> : <TriangleUpIcon /> : null}
        </chakra.span>
    );
}

export function ColumnResizer(props: {
    onDoubleClick: () => void;
    onMouseDown: (event: unknown) => void;
    onTouchStart: (event: unknown) => void;
    isResizing: boolean;
}): JSX.Element {
    const { onDoubleClick, onMouseDown, onTouchStart, isResizing } = props;
    const className = `resizer ${isResizing ? "isResizing" : ""}`;
    return (
        <chakra.span
            onDoubleClick={onDoubleClick}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className={className}
        ></chakra.span>
    );
}
