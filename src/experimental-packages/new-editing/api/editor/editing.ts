// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { MapModelProps } from "@open-pioneer/map";
import type { Vector as VectorSource } from "ol/source";

import { useEditing as useEditingImpl } from "../../implementation/hooks/editing/useEditing";

import type { DrawingState } from "../model/DrawingState";
import type { Editor } from "./editor";
import type { EditingStep } from "../model/EditingStep";
import type { InteractionOptions } from "../model/InteractionOptions";

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
 *     const drawingState = useEditing({ map, editingStep, setEditingStep });
 *
 *     // Render custom UI and controls...
 * }
 * ```
 */
export const useEditing = useEditingImpl;

/**
 * Options for the {@link useEditing} hook.
 *
 * Extends {@link MapModelProps} and {@link InteractionOptions} to provide map integration and
 * interaction configuration, along with editing workflow state management.
 */
export interface EditingOptions extends MapModelProps, InteractionOptions {
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
