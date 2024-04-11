// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { chakra } from "@open-pioneer/chakra-integration";
import classNames from "classnames";

export function ColumnResizer(props: {
    onDoubleClick: React.MouseEventHandler<HTMLElement>;
    onMouseDown: React.MouseEventHandler<HTMLElement>;
    onTouchStart: React.TouchEventHandler<HTMLElement>;
    isResizing: boolean;
}): JSX.Element {
    const { onDoubleClick, onMouseDown, onTouchStart, isResizing } = props;
    return (
        <chakra.span
            className={classNames(
                "result-list-resizer",
                isResizing && "result-list-resizer--is-resizing"
            )}
            onDoubleClick={onDoubleClick}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onClick={(e) => e.stopPropagation()}
        />
    );
}
