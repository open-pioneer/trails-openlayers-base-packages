// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HStack, IconButton } from "@chakra-ui/react";

import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";

import { useMemo, type ReactElement } from "react";
import { LuCheck, LuX, LuUndo, LuRedo } from "react-icons/lu";

import type { DrawingState } from "../../../api/model/DrawingState";

export function ActionBar({ drawingState }: ActionBarProps): ReactElement {
    const capabilities = useReactiveSnapshot(
        () => ({
            canUndo: drawingState.canUndo,
            canRedo: drawingState.canRedo,
            canFinish: drawingState.canFinish,
            canReset: drawingState.canReset
        }),
        [drawingState]
    );

    const actions = useMemo(
        () => ({
            undo: () => drawingState.undo(),
            redo: () => drawingState.redo(),
            finish: () => drawingState.finish(),
            reset: () => drawingState.reset()
        }),
        [drawingState]
    );

    const { formatMessage } = useIntl();

    const tooltips = useMemo(
        () => ({
            finishButton: formatMessage({ id: "actionSelector.finishButtonTooltip" }),
            resetButton: formatMessage({ id: "actionSelector.resetButtonTooltip" }),
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
                    disabled={!capabilities.canFinish}
                    onClick={actions.finish}
                >
                    <LuCheck size={25} />
                </IconButton>
            </Tooltip>

            <Tooltip content={tooltips.resetButton}>
                <IconButton
                    aria-label={tooltips.resetButton}
                    disabled={!capabilities.canReset}
                    onClick={actions.reset}
                >
                    <LuX size={25} />
                </IconButton>
            </Tooltip>

            <Tooltip content={tooltips.undoButton}>
                <IconButton
                    aria-label={tooltips.undoButton}
                    disabled={!capabilities.canUndo}
                    onClick={actions.undo}
                >
                    <LuUndo size={25} />
                </IconButton>
            </Tooltip>

            <Tooltip content={tooltips.redoButton}>
                <IconButton
                    aria-label={tooltips.redoButton}
                    disabled={!capabilities.canRedo}
                    onClick={actions.redo}
                >
                    <LuRedo size={25} />
                </IconButton>
            </Tooltip>
        </HStack>
    );
}

interface ActionBarProps {
    readonly drawingState: DrawingState;
}
