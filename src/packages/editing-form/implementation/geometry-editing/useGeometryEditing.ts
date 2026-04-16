// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMapModelValue, type MapModel, type LayerFactory } from "@open-pioneer/map";
import { useEffect, useMemo } from "react";
import { EditingController } from "./controller/EditingController";
import { CreationStep, EditingStep, UpdateStep } from "../../api/model/EditingStep";
import type { MapModelProps } from "@open-pioneer/map";
import type { Vector as VectorSource } from "ol/source";
import { InteractionOptions } from "../../api/model/InteractionOptions";
import { Editor } from "../Editor";
import { useService } from "open-pioneer:react-hooks";

/**
 * Options for the {@link useGeometryEditing} hook.
 *
 * Extends {@link MapModelProps} and {@link InteractionOptions} to provide map integration and
 * interaction configuration, along with editing workflow state management.
 */
export interface GeometryEditingOptions extends MapModelProps, InteractionOptions {
    /**
     * The current editing step in the workflow.
     *
     * Determines which interaction is active (drawing, selection, or modification) and what
     * feature is being edited. The hook responds to changes in this step by starting or stopping
     * the appropriate map interactions.
     */
    readonly editingStep: EditingStep;

    /**
     * Callback to update the editing step.
     *
     * Called by the editing interactions when the workflow should transition to a new step
     * (e.g., when a drawing is completed and should move to attribute editing).
     */
    readonly setEditingStep: (newEditingStep: EditingStep) => void;

    /**
     * Optional vector sources to enable snapping during drawing and modification.
     *
     * Features from these sources will be used as snap targets, allowing drawn geometries to
     * snap to existing features for precise alignment.
     */
    readonly snappingSources?: VectorSource[];
}

/**
 * The state object returned by the `useGeometryEditing` hook, providing both operations and capabilities
 * for the current geometry drawing session.
 *
 * Use the capability flags to enable/disable UI controls, and call the action methods to perform
 * drawing actions.
 * All methods are safe to call at any time; they will have no effect if the corresponding capability flag is `false`.
 *
 * @example
 * ```tsx
 * const drawingState = useGeometryEditing({ map, editingStep, setEditingStep });
 *
 * // Check capabilities before enabling buttons
 * <Button disabled={!drawingState.canUndo} onClick={drawingState.undo}>
 *     Undo
 * </Button>
 * ```
 */
export interface DrawingState {
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

    /**
     * Undoes the last geometry modification.
     *
     * Only has an effect when `canUndo` is `true`. Typically enabled during feature creation when
     * there are changes to revert.
     */
    undo: () => void;

    /**
     * Redoes a previously undone geometry modification.
     *
     * Only has an effect when `canRedo` is `true`. Typically enabled after an undo operation has
     * been performed.
     */
    redo: () => void;

    /**
     * Completes the current drawing operation and commits the geometry.
     *
     * Only has an effect when `canFinish` is `true`. Used during polygon or line drawing to
     * finalize the geometry when the minimum required points have been set (two for polylines,
     * three for polygons).
     */
    finish: () => void;

    /**
     * Resets the currently drawn geometry to its initial state.
     *
     * Only has an effect when `canReset` is `true`. Used to clear the drawn vertices and start
     * over without completing the geometry.
     */
    reset: () => void;
}

/**
 * React hook for managing map feature editing interactions.
 *
 * Provides low-level control over the editing workflow by managing map interactions based on the
 * current editing step. This hook handles drawing, selection, and modification interactions, and
 * returns the current drawing state for controlling undo/redo/finish/reset actions.
 *
 * Use this hook when building custom editing implementations that don't use the {@link Editor}
 * component. For most use cases, the {@link Editor} component is recommended as it provides a
 * complete editing interface with built-in UI.
 *
 * @param options - Configuration options for the editing workflow
 * @returns The current {@link DrawingState} for the active drawing interaction
 *
 * @example
 * ```tsx
 * function CustomEditor() {
 *     const map = useMapModel();
 *     const [editingStep, setEditingStep] = useState<EditingStep>({ id: "none" });
 *     const drawingState = useGeometryEditing({ map, editingStep, setEditingStep });
 *
 *     // Render custom UI and controls...
 * }
 * ```
 *
 * @internal
 * Private API for now. Consider publishing this as an "EditingInteraction" (not based solely on hooks).
 */
export function useGeometryEditing({
    map,
    editingStep,
    setEditingStep,
    snappingSources,
    ...interactionOptions
}: GeometryEditingOptions): DrawingState {
    const layerFactory = useService<LayerFactory>("map.LayerFactory");
    const controller = useEditingController(map, layerFactory);

    useEffect(() => {
        controller.setSnappingSources(snappingSources);
        controller.setInteractionOptions(interactionOptions);
    }, [controller, snappingSources, interactionOptions]);

    useEffect(() => {
        switch (editingStep.id) {
            case "initial":
                break;

            case "drawing":
                controller.startDrawingFeature({
                    geometryType: editingStep.template.geometryType,
                    drawingOptions: editingStep.template.drawingOptions ?? {},
                    completionHandler(feature, drawLayer) {
                        const template = editingStep.template;
                        feature.setProperties(template.defaultProperties ?? {});
                        setEditingStep({
                            id: "creation",
                            feature,
                            template,
                            drawLayer: drawLayer
                        } satisfies CreationStep);
                    }
                });
                break;

            case "selection":
                controller.startSelectingFeature({
                    layers: editingStep.layers,
                    completionHandler(feature, layer) {
                        setEditingStep({
                            id: "update",
                            feature,
                            layer
                        } satisfies UpdateStep);
                    }
                });
                break;

            case "creation":
                controller.startModifyingFeature({
                    feature: editingStep.feature,
                    drawLayer: editingStep.drawLayer
                });
                break;

            case "update":
                controller.startModifyingFeature({
                    feature: editingStep.feature
                });
                break;
        }
        return () => {
            controller.stopCurrentInteractions();
        };
    }, [controller, editingStep, setEditingStep]);

    return controller.drawingSession;
}

function useEditingController(
    map: MapModel | undefined,
    layerFactory: LayerFactory
): EditingController {
    const mapModel = useMapModelValue({ map });
    return useMemo(() => new EditingController(mapModel, layerFactory), [mapModel, layerFactory]);
}
