// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { chakra } from "@chakra-ui/react";
import { SortDirection } from "@tanstack/react-table";
import { ReactNode } from "react";

export function ColumnSortIndicator(props: { isSorted: false | SortDirection }): ReactNode {
    const { isSorted } = props;
    return (
        <chakra.span ml="4" className="result-list-sort-indicator">
            {isSorted ? isSorted === "desc" ? <FiChevronDown /> : <FiChevronRight /> : null}{" "}
            {/*todo find correct icons and fix positioning*/}
        </chakra.span>
    );
}
