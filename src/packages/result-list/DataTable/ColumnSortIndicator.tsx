// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
import { chakra } from "@open-pioneer/chakra-integration";
import { SortDirection } from "@tanstack/react-table";

export function ColumnSortIndicator(props: { isSorted: false | SortDirection }): JSX.Element {
    const { isSorted } = props;
    return (
        <chakra.span ml="4" className="result-list-sort-indicator">
            {isSorted ? isSorted === "desc" ? <TriangleDownIcon /> : <TriangleUpIcon /> : null}
        </chakra.span>
    );
}
