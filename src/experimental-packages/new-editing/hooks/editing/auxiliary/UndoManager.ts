// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { computed, reactiveArray, untracked, type ReactiveArray } from "@conterra/reactivity-core";

export class UndoManager<T> {
    addEdit(edit: T): void {
        this.undoStack.push(edit);
        clear(this.redoStack);
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
        clear(this.undoStack);
        clear(this.redoStack);
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

function clear(array: ReactiveArray<unknown>): void {
    const length = untracked(() => array.length);
    array.splice(0, length);
}
