// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/**
 * The state object returned by the `useEditing` hook, providing both operations and capabilities
 * for the current geometry drawing session.
 *
 * This type combines {@link DrawingActions} (methods to control editing operations) with
 * {@link DrawingCapabilities} (boolean flags indicating which operations are currently available).
 * Use the capability flags to enable/disable UI controls, and call the action methods to perform
 * drawing actions.
 *
 * @example
 * ```tsx
 * const drawingState = useEditing({ map, editingStep, setEditingStep });
 *
 * // Check capabilities before enabling buttons
 * <Button disabled={!drawingState.canUndo} onClick={drawingState.undo}>
 *     Undo
 * </Button>
 * ```
 */
export type DrawingState = DrawingActions & DrawingCapabilities;

/**
 * Interface providing methods to control geometry drawing operations.
 *
 * These methods allow programmatic control over the drawing workflow, including undo/redo
 * functionality, drawing completion, and geometry reset. All methods are safe to call at any time;
 * they will have no effect if the corresponding capability flag is `false`.
 */
export interface DrawingActions {
    /**
     * Undoes the last geometry modification.
     *
     * Only has an effect when `canUndo` is `true`. Typically enabled during feature creation when
     * there are changes to revert.
     */
    readonly undo: () => void;

    /**
     * Redoes a previously undone geometry modification.
     *
     * Only has an effect when `canRedo` is `true`. Typically enabled after an undo operation has
     * been performed.
     */
    readonly redo: () => void;

    /**
     * Completes the current drawing operation and commits the geometry.
     *
     * Only has an effect when `canFinish` is `true`. Used during polygon or line drawing to
     * finalize the geometry when the minimum required points have been set (two for polylines,
     * three for polygons).
     */
    readonly finish: () => void;

    /**
     * Resets the currently drawn geometry to its initial state.
     *
     * Only has an effect when `canReset` is `true`. Used to clear the drawn vertices and start
     * over without completing the geometry.
     */
    readonly reset: () => void;
}

/**
 * Interface providing boolean flags indicating which drawing operations are currently available.
 *
 * Use these flags to control the enabled/disabled state of UI controls (buttons, menu items, etc.)
 * in your editing interface. The flags are updated automatically based on the current geometry
 * state and interaction type.
 */
export interface DrawingCapabilities {
    /**
     * Whether the undo operation is currently available.
     *
     * `true` when there are geometry modifications that can be reverted, typically during feature
     * creation workflows.
     */
    readonly canUndo: boolean;

    /**
     * Whether the redo operation is currently available.
     *
     * `true` when there are undone modifications that can be reapplied, typically after performing
     * an undo operation.
     */
    readonly canRedo: boolean;

    /**
     * Whether the finish operation is currently available.
     *
     * `true` when a polygon or line is being drawn and the minimum required points have been set
     * to form a valid geometry (two vertices for polylines, three vertices for polygons).
     */
    readonly canFinish: boolean;

    /**
     * Whether the reset operation is currently available.
     *
     * `true` when a drawing operation for polylines or polygons is in progress and at least one
     * vertex has been set. Allows resetting the drawn geometry to start over.
     */
    readonly canReset: boolean;
}
