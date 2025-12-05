// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
export type EditingState = EditingOperator & EditingCapabilities;

export interface EditingOperator {
    readonly undo: () => void;
    readonly redo: () => void;
    readonly finishDrawing: () => void;
    readonly abortDrawing: () => void;
}

export interface EditingCapabilities {
    readonly canUndo: boolean;
    readonly canRedo: boolean;
    readonly canFinishDrawing: boolean;
    readonly canAbortDrawing: boolean;
}
