// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HStack, IconButton } from "@chakra-ui/react";

import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";

import { useMemo, type ReactElement } from "react";
import { LuCheck, LuX, LuUndo, LuRedo } from "react-icons/lu";

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

    const tooltips = useMemo(
        () => ({
            finishButton: formatMessage({ id: "actionSelector.finishButtonTooltip" }),
            abortButton: formatMessage({ id: "actionSelector.abortButtonTooltip" }),
            undoButton: formatMessage({ id: "actionSelector.undoButtonTooltip" }),
            redoButton: formatMessage({ id: "actionSelector.redoButtonTooltip" })
        }),
        [formatMessage]
    );

    return (
        <HStack justify="right" gap={3}>
            <Tooltip content={tooltips.finishButton}>
                <IconButton
                    aria-label={tooltips.finishButton}
                    disabled={!capabilities.canFinishDrawing}
                    onClick={operator.finishDrawing}
                >
                    <LuCheck size={25} />
                </IconButton>
            </Tooltip>

            <Tooltip content={tooltips.abortButton}>
                <IconButton
                    aria-label={tooltips.abortButton}
                    disabled={!capabilities.canAbortDrawing}
                    onClick={operator.abortDrawing}
                >
                    <LuX size={25} />
                </IconButton>
            </Tooltip>

            <Tooltip content={tooltips.undoButton}>
                <IconButton
                    aria-label={tooltips.undoButton}
                    disabled={!capabilities.canUndo}
                    onClick={operator.undo}
                >
                    <LuUndo size={25} />
                </IconButton>
            </Tooltip>

            <Tooltip content={tooltips.redoButton}>
                <IconButton
                    aria-label={tooltips.redoButton}
                    disabled={!capabilities.canRedo}
                    onClick={operator.redo}
                >
                    <LuRedo size={25} />
                </IconButton>
            </Tooltip>
        </HStack>
    );
}

interface ActionBarProps {
    readonly editingState: EditingState;
}
