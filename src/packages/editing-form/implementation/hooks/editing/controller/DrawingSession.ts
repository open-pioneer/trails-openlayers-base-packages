// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive, synchronized, watchValue, type CleanupHandle } from "@conterra/reactivity-core";

import { unByKey } from "ol/Observable";
import type { Feature } from "ol";
import type { Coordinate } from "ol/coordinate";

import {
    canBeReset,
    canBeFinished,
    getLastCoordinate,
    getNumberOfVertices
} from "../auxiliary/geometryState";

import { UndoManager } from "../auxiliary/UndoManager";
import type { DrawingState } from "../../../../api/model/DrawingState";

export class DrawingSession implements DrawingTracker, DrawingState {
    trackCapabilities(feature: Feature, actionHandler: DrawingActionHandler): void {
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

            this.ignoreNextEdit = true;

            // TODO: When undoing the very first change (that is, removing the first vertex),
            // a "drawabort" event is fired causing the undo history to be reset.
            this.watchHandle = watchValue(
                () => numberOfVertices.value,
                (numberOfVertices) => {
                    this.canFinishSignal.value = canBeFinished(geometry, numberOfVertices);
                    this.canResetSignal.value = canBeReset(geometry, numberOfVertices);

                    if (!this.ignoreNextEdit) {
                        const lastCoordinate = getLastCoordinate(geometry);
                        if (lastCoordinate != null) {
                            this.undoManager.addEdit(lastCoordinate);
                        }
                    } else {
                        this.ignoreNextEdit = false;
                    }
                },
                { immediate: true }
            );

            this.actionHandler = actionHandler;
        }
    }

    finish(): void {
        if (this.canFinish) {
            this.actionHandler?.finish();
        }
    }

    reset(): void {
        if (this.canReset) {
            this.actionHandler?.reset();
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

        this.canFinishSignal.value = undefined;
        this.canResetSignal.value = undefined;
        this.undoManager.reset();

        this.actionHandler = undefined;
    }

    get canFinish(): boolean {
        return this.canFinishSignal.value ?? false;
    }

    get canReset(): boolean {
        return this.canResetSignal.value ?? false;
    }

    get canUndo(): boolean {
        return this.undoManager.canUndo;
    }

    get canRedo(): boolean {
        return this.undoManager.canRedo;
    }

    private ignoreNextEdit = false;
    private actionHandler: DrawingActionHandler | undefined;
    private watchHandle: CleanupHandle | undefined;

    private readonly canFinishSignal = reactive<boolean>();
    private readonly canResetSignal = reactive<boolean>();
    private readonly undoManager = new UndoManager<Coordinate>();
}

export interface DrawingTracker {
    readonly trackCapabilities: (feature: Feature, actionHandler: DrawingActionHandler) => void;
    readonly untrackCapabilities: () => void;
}

export interface DrawingActionHandler {
    readonly undo: () => void;
    readonly redo: (coordinate: Coordinate) => void;
    readonly finish: () => void;
    readonly reset: () => void;
}
