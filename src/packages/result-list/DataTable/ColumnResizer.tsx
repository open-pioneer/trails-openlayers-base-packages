// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { chakra } from "@chakra-ui/react";
import classNames from "classnames";
import { ReactNode } from "react";

export function ColumnResizer(props: {
    onDoubleClick: React.MouseEventHandler<HTMLElement>;
    onMouseDown: React.MouseEventHandler<HTMLElement>;
    onTouchStart: React.TouchEventHandler<HTMLElement>;
    isResizing: boolean;
}): ReactNode {
    const { onDoubleClick, onMouseDown, onTouchStart, isResizing } = props;
    return (
        <chakra.span
            className={classNames(
                "result-list-resizer",
                isResizing && "result-list-resizer--is-resizing"
            )}
            aria-hidden="true"
            onDoubleClick={onDoubleClick}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onClick={(e) => e.stopPropagation()}
        />
    );
}
