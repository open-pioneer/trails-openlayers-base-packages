// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { TbCaretDownFilled, TbCaretUpFilled } from "react-icons/tb";
import { chakra } from "@chakra-ui/react";
import { SortDirection } from "@tanstack/react-table";
import { ReactNode } from "react";

export function ColumnSortIndicator(props: { isSorted: false | SortDirection }): ReactNode {
    const { isSorted } = props;
    return (
        <chakra.span ml="4" className="result-list-sort-indicator" aria-hidden="true">
            {isSorted ? isSorted === "desc" ? <TbCaretDownFilled /> : <TbCaretUpFilled /> : null}
        </chakra.span>
    );
}
