// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HStack, IconButton } from "@chakra-ui/react";

import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";

import { useMemo, type ReactElement } from "react";
import { GoCheckCircle, GoXCircle } from "react-icons/go";
import { LuUndo, LuRedo } from "react-icons/lu";

import type { EditingState } from "../../model/EditingState";

export function ActionBar({ editingState }: ActionBarProps): ReactElement {
    const capabilities = useReactiveSnapshot(
        () => ({
            canUndo: editingState.canUndo,
            canRedo: editingState.canRedo,
            canFinishDrawing: editingState.canFinishDrawing,
            canAbortDrawing: editingState.canAbortDrawing
        }),
        [editingState]
    );

    const operator = useMemo(
        () => ({
            undo: () => editingState.undo(),
            redo: () => editingState.redo(),
            finishDrawing: () => editingState.finishDrawing(),
            abortDrawing: () => editingState.abortDrawing()
        }),
        [editingState]
    );

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
                disabled={!capabilities.canFinishDrawing}
                onClick={operator.finishDrawing}
            >
                <GoCheckCircle size={25} />
            </IconButton>
            <IconButton
                aria-label={ariaLabels.abortButton}
                disabled={!capabilities.canAbortDrawing}
                onClick={operator.abortDrawing}
            >
                <GoXCircle size={25} />
            </IconButton>
            <IconButton
                aria-label={ariaLabels.undoButton}
                disabled={!capabilities.canUndo}
                onClick={operator.undo}
            >
                <LuUndo size={25} />
            </IconButton>
            <IconButton
                aria-label={ariaLabels.redoButton}
                disabled={!capabilities.canRedo}
                onClick={operator.redo}
            >
                <LuRedo size={25} />
            </IconButton>
        </HStack>
    );
}

interface ActionBarProps {
    readonly editingState: EditingState;
}
