// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { computed, reactiveArray } from "@conterra/reactivity-core";

export class UndoManager<T> {
    addEdit(edit: T): void {
        this.undoStack.push(edit);
        this.redoStack.splice(0);
    }

    undo(): T | undefined {
        const edit = this.undoStack.pop();
        if (edit != null) {
            this.redoStack.push(edit);
        }
        return edit;
    }

    redo(): T | undefined {
        const edit = this.redoStack.pop();
        if (edit != null) {
            this.undoStack.push(edit);
        }
        return edit;
    }

    reset(): void {
        this.undoStack.splice(0);
        this.redoStack.splice(0);
    }

    get canUndo(): boolean {
        return this.canUndoSignal.value;
    }

    get canRedo(): boolean {
        return this.canRedoSignal.value;
    }

    private undoStack = reactiveArray<T>();
    private redoStack = reactiveArray<T>();

    private canUndoSignal = computed(() => this.undoStack.length >= 1);
    private canRedoSignal = computed(() => this.redoStack.length >= 1);
}
