// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Layer, MapModelProps } from "@open-pioneer/map";
import Feature from "ol/Feature";
import { FC } from "react";
import { Editor as EditorImpl } from "../../implementation/Editor";
import type { EditingStorage } from "../model/EditingStorage";
import type { EditingStep } from "../model/EditingStep";
import type { FeatureTemplate, FormTemplate } from "../model/FeatureTemplate";
import type { InteractionOptions } from "../model/InteractionOptions";

/**
 * React component that provides a complete editing interface for creating and modifying map
 * features.
 *
 * The Editor component manages the entire editing workflow, including feature creation, selection,
 * modification, and deletion. It renders different UI states based on the current editing step:
 * - An action selector for choosing feature templates and initiating drawing, or selecting
 * existing features.
 * - A property editor for modifying feature attributes and geometry.
 *
 * @example
 * ```tsx
 * <Editor
 *     map={mapModel}
 *     templates={featureTemplates}
 *     storage={{
 *         addFeature: async (feature) => { ... },
 *         updateFeature: async (feature) => { ... },
 *         deleteFeature: async (feature) => { ... }
 *     }}
 *     selectableLayers={[myLayer]}
 * />
 * ```
 *
 * @group Editor
 * @expandType EditorProps
 */
export const Editor: FC<EditorProps> = EditorImpl;

/**
 * Props for the {@link Editor} component.
 *
 * @group Editor
 */
export interface EditorProps extends MapModelProps, InteractionOptions {
    /**
     * Feature templates defining the types of features that can be created or edited.
     *
     * Each template specifies the geometry type, drawing options, and form configuration
     * for a specific feature type.
     */
    readonly templates: FeatureTemplate[];

    /**
     * Responsible for persisting changes to your data source.
     */
    readonly storage: EditingStorage;

    /**
     * Optional function to provide custom form templates for features.
     *
     * When specified, this function is called to determine which form template to use
     * when editing an existing feature. If not provided, the first feature template
     * matching the feature's layer ID will be used.
     *
     * @returns The form template to use for editing the feature's properties, or `undefined` if no
     * template is available.
     */
    readonly resolveFormTemplate?: (context: FormTemplateContext) => FormTemplate | undefined;

    /**
     * Layers from which features can be selected for editing.
     *
     * When not specified, the layer IDs from the feature templates are used to determine
     * which layers are selectable. Only specify layers that contain features you want to
     * allow users to edit.
     */
    readonly selectableLayers?: Layer[];

    /**
     * Layers to which drawn geometries will snap.
     *
     * Enables snapping to features in these layers during drawing and modification operations.
     * Defaults to {@link selectableLayers} if not specified.
     *
     * @default selectableLayers
     */
    readonly snappableLayers?: Layer[];

    /**
     * Whether to show the action bar with undo/redo/finish/reset controls during drawing.
     *
     * When `false`, the action bar is hidden. Only applies to templates with geometry types
     * that support these actions (e.g., `Polygon`, `LineString`).
     *
     * @default true
     */
    readonly showActionBar?: boolean;

    /**
     * Duration in milliseconds to display success notifications.
     *
     * Controls how long success messages (e.g., "Feature saved") are shown to the user.
     * By default, notifiers will never disappear.
     *
     * Use `false` to hide the notification altogether.
     */
    readonly successNotifierDisplayDuration?: number | false;

    /**
     * Duration in milliseconds to display failure notifications.
     *
     * Controls how long error messages are shown to the user.
     * By default, notifiers will never disappear.
     *
     * Use `false` to hide the notification altogether.
     */
    readonly failureNotifierDisplayDuration?: number | false;

    /**
     * Optional callback invoked when the editing step changes.
     *
     * Called whenever the editing workflow transitions between steps (e.g., from drawing to
     * attribute editing, or from attribute editing back to the initial state).
     *
     * Use this to track or respond to changes in the editing workflow state.
     */
    readonly onEditingStepChange?: (newEditingStep: EditingStep) => void;
}

/** @group Editor */
export interface FormTemplateContext {
    /** The OpenLayers feature being edited. */
    feature: Feature;

    /** The layer containing the feature, or `undefined` if not available. */
    layer: Layer | undefined;
}
