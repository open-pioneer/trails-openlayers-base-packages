// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HStack, IconButton } from "@chakra-ui/react";
import { useIntl } from "open-pioneer:react-hooks";
import { GoCheckCircle, GoXCircle } from "react-icons/go";
import { LuUndo, LuRedo } from "react-icons/lu";

import { useMemo, type ReactElement } from "react";
import type { VoidCallback } from "../../types/types";

export function ActionBar({
    canFinish,
    canAbort,
    canUndo,
    canRedo,
    onFinish,
    onAbort,
    onUndo,
    onRedo
}: ActionBarProps): ReactElement {
    const { formatMessage } = useIntl();

    const ariaLabels = useMemo(
        () => ({
            finishButton: formatMessage({ id: "actionSelector.finishButtonAriaLabel" }),
            abortButton: formatMessage({ id: "actionSelector.abortButtonAriaLabel" }),
            undoButton: formatMessage({ id: "actionSelector.undoButtonAriaLabel" }),
            redoButton: formatMessage({ id: "actionSelector.redoButtonAriaLabel" })
        }),
        [formatMessage]
    );

    return (
        <HStack justify="right" gap={3}>
            <IconButton
                aria-label={ariaLabels.finishButton}
                disabled={!canFinish}
                onClick={onFinish}
            >
                <GoCheckCircle size={25} />
            </IconButton>
            <IconButton aria-label={ariaLabels.abortButton} disabled={!canAbort} onClick={onAbort}>
                <GoXCircle size={25} />
            </IconButton>
            <IconButton aria-label={ariaLabels.undoButton} disabled={!canUndo} onClick={onUndo}>
                <LuUndo size={25} />
            </IconButton>
            <IconButton aria-label={ariaLabels.redoButton} disabled={!canRedo} onClick={onRedo}>
                <LuRedo size={25} />
            </IconButton>
        </HStack>
    );
}

export interface ActionBarProps {
    readonly canFinish: boolean;
    readonly canAbort: boolean;
    readonly canUndo: boolean;
    readonly canRedo: boolean;

    readonly onFinish: VoidCallback;
    readonly onAbort: VoidCallback;
    readonly onUndo: VoidCallback;
    readonly onRedo: VoidCallback;
}
