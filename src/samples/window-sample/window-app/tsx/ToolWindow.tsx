// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    useCallback,
    type Dispatch,
    type ReactElement,
    type ReactNode,
    type SetStateAction
} from "react";

import { Window, type WindowProps } from "window";
import type { ToolbarState } from "./Toolbar";

export function ToolWindow({
    toolbarStateKey,
    toolbarState,
    setToolbarState,
    children,
    ...windowProps
}: ToolWindowProps): ReactElement | undefined {
    const isVisible = toolbarState[toolbarStateKey];

    const onClose = useCallback(() => {
        setToolbarState((toolbarState) => ({
            ...toolbarState,
            [toolbarStateKey]: false
        }));
    }, [setToolbarState, toolbarStateKey]);

    if (isVisible) {
        return (
            <Window onClose={onClose} {...windowProps}>
                {children}
            </Window>
        );
    } else {
        return undefined;
    }
}

export interface ToolbarStateProps {
    readonly toolbarStateKey: keyof ToolbarState;
    readonly toolbarState: ToolbarState;
    readonly setToolbarState: Dispatch<SetStateAction<ToolbarState>>;
}

interface Children {
    readonly children?: ReactNode;
}

type ToolWindowProps = WindowProps & ToolbarStateProps & Children;
