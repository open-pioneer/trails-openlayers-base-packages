// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive, synchronized, watchValue, type CleanupHandle } from "@conterra/reactivity-core";

import { unByKey } from "ol/Observable";
import type { Feature } from "ol";
import type { Coordinate } from "ol/coordinate";

import {
    canBeAborted,
    canBeFinished,
    getLastCoordinate,
    getNumberOfVertices
} from "../auxiliary/geometryState";

import { UndoManager } from "../auxiliary/UndoManager";
import type { EditingState } from "../../../model/EditingState";

export class EditingSession implements EditingTracker, EditingState {
    trackCapabilities(feature: Feature, actionHandler: EditingActionHandler): void {
        this.untrackCapabilities();

        const geometry = feature.getGeometry();

        if (geometry != null) {
            const numberOfVertices = synchronized(
                () => getNumberOfVertices(geometry),
                (callback) => {
                    const eventsKey = geometry.on("change", callback);
                    return () => unByKey(eventsKey);
                }
            );

            // TODO: When undoing the very first change (that is, removing the first vertex),
            // a "drawabort" event is fired causing the undo history to be reset.
            this.watchHandle = watchValue(
                () => numberOfVertices.value,
                (numberOfVertices) => {
                    console.log("#vertices =", numberOfVertices);
                    this.canFinishDrawingSignal.value = canBeFinished(geometry, numberOfVertices);
                    this.canAbortDrawingSignal.value = canBeAborted(geometry, numberOfVertices);

                    if (!this.ignoreNextEdit) {
                        const lastCoordinate = getLastCoordinate(geometry);
                        if (lastCoordinate != null) {
                            this.undoManager.addEdit(lastCoordinate);
                        }
                    } else {
                        this.ignoreNextEdit = false;
                    }
                }
            );

            this.actionHandler = actionHandler;
        }
    }

    finishDrawing(): void {
        if (this.canFinishDrawing) {
            this.actionHandler?.finishDrawing();
        }
    }

    abortDrawing(): void {
        if (this.canAbortDrawing) {
            this.actionHandler?.abortDrawing();
        }
    }

    undo(): void {
        if (this.canUndo && this.actionHandler != null) {
            this.undoManager.undo();
            this.ignoreNextEdit = true;
            this.actionHandler.undo();
        }
    }

    redo(): void {
        if (this.canRedo && this.actionHandler != null) {
            const coordinate = this.undoManager.redo();
            if (coordinate != null) {
                this.ignoreNextEdit = true;
                this.actionHandler.redo(coordinate);
            }
        }
    }

    untrackCapabilities(): void {
        this.watchHandle?.destroy();

        this.canFinishDrawingSignal.value = undefined;
        this.canAbortDrawingSignal.value = undefined;
        this.undoManager.reset();

        this.actionHandler = undefined;
    }

    get canFinishDrawing(): boolean {
        return this.canFinishDrawingSignal.value ?? false;
    }

    get canAbortDrawing(): boolean {
        return this.canAbortDrawingSignal.value ?? false;
    }

    get canUndo(): boolean {
        return this.undoManager.canUndo;
    }

    get canRedo(): boolean {
        return this.undoManager.canRedo;
    }

    private ignoreNextEdit = false;
    private actionHandler: EditingActionHandler | undefined;
    private watchHandle: CleanupHandle | undefined;

    private readonly canFinishDrawingSignal = reactive<boolean>();
    private readonly canAbortDrawingSignal = reactive<boolean>();
    private readonly undoManager = new UndoManager<Coordinate>();
}

export interface EditingTracker {
    readonly trackCapabilities: (feature: Feature, actionHandler: EditingActionHandler) => void;
    readonly untrackCapabilities: () => void;
}

export interface EditingActionHandler {
    readonly undo: () => void;
    readonly redo: (coordinate: Coordinate) => void;
    readonly finishDrawing: () => void;
    readonly abortDrawing: () => void;
}
