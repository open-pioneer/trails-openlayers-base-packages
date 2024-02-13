// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HTMLProps, useRef } from "react";
import { Checkbox, Tooltip, chakra } from "@open-pioneer/chakra-integration";
import { SortDirection } from "@tanstack/react-table";
import { useIntl } from "open-pioneer:react-hooks";
import { PackageIntl } from "@open-pioneer/runtime";
import { TriangleDownIcon, TriangleUpIcon, UpDownIcon } from "@chakra-ui/icons";

export function IndeterminateCheckbox({
    indeterminate,
    className = "",
    ...rest
}: {
    indeterminate?: boolean;
    toolTipLabel?: string;
} & HTMLProps<HTMLInputElement>) {
    const ref = useRef<HTMLInputElement>(null!);
    const intl = useIntl();

    let ariaLabel;
    if (className === "result-list-select-all-checkbox") {
        ariaLabel = intl?.formatMessage({
            id: "ariaLabel.selectAll"
        });
    } else {
        ariaLabel = intl?.formatMessage({
            id: "ariaLabel.selectSingle"
        });
    }
    return (
        <Tooltip
            {...{}}
            label={getCheckboxToolTip(rest.checked, intl)}
            placement="right"
            shouldWrapChildren={true}
        >
            <Checkbox
                ref={ref}
                aria-label={ariaLabel}
                className={className + " cursor-pointer"}
                isChecked={rest.checked}
                onChange={rest.onChange}
                isIndeterminate={indeterminate}
            ></Checkbox>
        </Tooltip>
    );
}

function getCheckboxToolTip<Data>(checked: boolean | undefined, intl: PackageIntl) {
    if (checked) {
        return intl?.formatMessage({ id: "deSelectAllTooltip" });
    } else {
        return intl?.formatMessage({ id: "selectAllTooltip" });
    }
}

export function ColumnSorter(props: {
    toggleSorting: () => void;
    isSorted: false | SortDirection;
}): JSX.Element {
    const { toggleSorting, isSorted } = props;
    const intl = useIntl();
    const ariaLabel = getSortingAriaLabel(intl, isSorted);

    const onEnterPressed = (evt: React.KeyboardEvent<HTMLSpanElement>) => {
        const key = evt.key;
        if (key === "Enter") {
            toggleSorting();
        }
    };

    return (
        <chakra.span
            ml="4"
            tabIndex={0}
            className="result-list-sort-icon"
            aria-label={ariaLabel}
            onKeyDown={onEnterPressed}
        >
            {isSorted ? (
                isSorted === "desc" ? (
                    <TriangleDownIcon />
                ) : (
                    <TriangleUpIcon />
                )
            ) : (
                <UpDownIcon className="result-list-sort-initial-icon" />
            )}
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

type SortState = SortDirection | false;
function getSortingAriaLabel(intl: PackageIntl, sortState: SortState) {
    switch (sortState) {
        case "asc":
            return intl.formatMessage({
                id: "ariaLabel.sortAscending"
            });
        case "desc":
            return intl.formatMessage({
                id: "ariaLabel.sortDescending"
            });
        case false:
            return intl.formatMessage({
                id: "ariaLabel.sortInitial"
            });
    }
}
