// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PiCaretDownFill, PiCaretUpFill } from "react-icons/pi";
import { chakra } from "@chakra-ui/react";
import { SortDirection } from "@tanstack/react-table";
import { ReactNode } from "react";

export function ColumnSortIndicator(props: { isSorted: false | SortDirection }): ReactNode {
    const { isSorted } = props;
    return (
        <chakra.span ml="4" className="result-list-sort-indicator" aria-hidden="true">
            {isSorted ? isSorted === "desc" ? <PiCaretDownFill /> : <PiCaretUpFill /> : null}
        </chakra.span>
    );
}
