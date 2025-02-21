// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
export class UndoManager<T> {
    addEdit(edit: T): void {
        this.undoStack.push(edit);
        this.redoStack = [];
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
        this.undoStack = [];
        this.redoStack = [];
    }

    get canUndo(): boolean {
        return this.undoStack.length >= 1;
    }

    get canRedo(): boolean {
        return this.redoStack.length >= 1;
    }

    private undoStack: T[] = [];
    private redoStack: T[] = [];
}
