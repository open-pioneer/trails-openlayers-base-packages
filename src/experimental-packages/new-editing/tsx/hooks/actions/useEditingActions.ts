// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Feature } from "ol";
import type { Coordinate } from "ol/coordinate";
import type { EventsKey } from "ol/events";
import type { Geometry } from "ol/geom";
import { unByKey } from "ol/Observable";

import { useMemo, useRef, useState } from "react";
import { UndoManager } from "./UndoManager";
import {
    canBeAborted,
    canBeFinished,
    getNumberOfVertices,
    getLastCoordinate
} from "./geometryHelpers";
import type { Callback, VoidCallback } from "../../types/types";

export function useEditingActions(): EditingState {
    const undoManager = useMemo(() => new UndoManager<Coordinate>(), []);
    const ignoreNextEdit = useRef(false);
    const numberOfVertices = useRef<number>();
    const eventsKey = useRef<EventsKey | undefined>();

    const [capabilities, setCapabilities] = useState(INITIAL_CAPABILITIES);
    const actionHandler = useMemo<EditingActionHandler>(() => ({}), []);

    const tracker = useMemo(
        () => ({
            trackCapabilities(feature: Feature) {
                this.untrackCapabilities();

                const geometry = feature.getGeometry();
                if (geometry != null) {
                    this.handleGeometryChange(geometry);
                    eventsKey.current = geometry.on("change", ({ target: geometry }) => {
                        this.handleGeometryChange(geometry);
                    });
                }
            },

            untrackCapabilities() {
                if (eventsKey.current != null) {
                    unByKey(eventsKey.current);
                    eventsKey.current = undefined;
                }
                numberOfVertices.current = undefined;
                undoManager.reset();
                setCapabilities(INITIAL_CAPABILITIES);
            },

            handleGeometryChange(geometry: Geometry) {
                const newNumberOfVertices = getNumberOfVertices(geometry);
                if (
                    newNumberOfVertices != null &&
                    newNumberOfVertices !== numberOfVertices.current
                ) {
                    this.recordChange(geometry, newNumberOfVertices);
                    numberOfVertices.current = newNumberOfVertices;
                    setCapabilities({
                        canUndo: undoManager.canUndo,
                        canRedo: undoManager.canRedo,
                        canFinishDrawing: canBeFinished(geometry, newNumberOfVertices) ?? false,
                        canAbortDrawing: canBeAborted(geometry, newNumberOfVertices) ?? false
                    });
                }
            },

            recordChange(geometry: Geometry, newNumberOfVertices: number) {
                if (!ignoreNextEdit.current) {
                    if (
                        numberOfVertices.current == null ||
                        numberOfVertices.current < newNumberOfVertices
                    ) {
                        const lastCoordinate = getLastCoordinate(geometry);
                        if (lastCoordinate != null) {
                            undoManager.addEdit(lastCoordinate);
                        }
                    }
                } else {
                    ignoreNextEdit.current = false;
                }
            }
        }),
        [undoManager]
    );

    // TODO: When undoing the very first change (that is, removing the first vertex), a "drawabort"
    // event is fired causing the undo history to be reset.
    const actions = useMemo<EditingActions>(
        () => ({
            undo() {
                if (actionHandler.onUndo != null) {
                    undoManager.undo();
                    ignoreNextEdit.current = true;
                    actionHandler.onUndo();
                }
            },
            redo() {
                if (actionHandler.onRedo != null) {
                    const coordinate = undoManager.redo();
                    if (coordinate != null) {
                        ignoreNextEdit.current = true;
                        actionHandler.onRedo(coordinate);
                    }
                }
            },
            finishDrawing() {
                actionHandler.onFinishDrawing?.();
            },
            abortDrawing() {
                actionHandler.onAbortDrawing?.();
            }
        }),
        [actionHandler, undoManager]
    );

    return useMemo(
        () => ({ actions, capabilities, tracker, actionHandler }),
        [actions, capabilities, tracker, actionHandler]
    );
}

const INITIAL_CAPABILITIES: EditingCapabilities = {
    canUndo: false,
    canRedo: false,
    canFinishDrawing: false,
    canAbortDrawing: false
};

interface EditingState {
    readonly actions: EditingActions;
    readonly capabilities: EditingCapabilities;
    readonly tracker: EditingTracker;
    readonly actionHandler: EditingActionHandler;
}

export interface EditingActions {
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

export interface EditingTracker {
    readonly trackCapabilities: (feature: Feature) => void;
    readonly untrackCapabilities: () => void;
}

export interface EditingActionHandler {
    onUndo?: VoidCallback;
    onRedo?: Callback<Coordinate>;
    onFinishDrawing?: VoidCallback;
    onAbortDrawing?: VoidCallback;
}
