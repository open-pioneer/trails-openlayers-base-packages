// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Layer } from "@open-pioneer/map";
import type { useReactiveSnapshot } from "@open-pioneer/reactivity";
import type { ReactiveMap } from "@conterra/reactivity-core";

import type { Feature } from "ol";

import { usePropertyFormContext as usePropertyFormContextImpl } from "../../implementation/context/usePropertyFormContext";

import type { FeatureTemplate } from "../model/FeatureTemplate";
import type { CreationStep, ModificationStep, UpdateStep } from "../model/EditingStep";
import type { DynamicFormTemplate } from "../model/FeatureTemplate";

/**
 * React hook for accessing the property form context.
 *
 * Provides access to the {@link PropertyFormContext} instance, which contains the current feature
 * being edited and methods to read and update its properties. This hook must be called from within
 * a component that is rendered inside a property form (typically in a custom form rendered by
 * {@link DynamicFormTemplate}).
 *
 * The context also allows controlling the form's validity by setting the `isValid` property,
 * which determines whether the save button is enabled.
 *
 * @returns The current {@link PropertyFormContext} instance.
 * @throws Error if called outside of a property form context (e.g., when no feature is being
 * edited).
 *
 * @example
 * ```tsx
 * function CustomForm() {
 *     const context = usePropertyFormContext();
 *     const name = useReactiveSnapshot(() => context.properties.get("name") ?? "", [context]);
 *
 *     useEffect(() => {
 *         context.isValid = name.length >= 1;
 *     }, [context, name]);
 *
 *     return (
 *         <input
 *             value={name}
 *             onChange={(e) => context.properties.set("name", e.target.value)}
 *         />
 *     );
 * }
 * ```
 */
export const usePropertyFormContext = usePropertyFormContextImpl;

/**
 * Context object providing access to feature properties and editing state during form editing.
 *
 * This class manages the state of a feature being edited, including its properties, validation
 * status, and associated metadata. It provides reactive property management through a
 * {@link ReactiveMap}, allowing components to automatically re-render when properties change.
 *
 * Access this context in custom forms using the {@link usePropertyFormContext} hook.
 */
export interface PropertyFormContext {
    /**
     * The OpenLayers feature being edited.
     *
     * Provides direct access to the feature object, which includes its geometry and properties.
     */
    readonly feature: Feature;

    /**
     * Reactive map of feature properties.
     *
     * Provides reactive access to all feature properties (excluding geometry). Use `get()` to read
     * property values and `set()` to update them. Components can use {@link useReactiveSnapshot}
     * to automatically re-render when values change.
     *
     * @example
     * ```ts
     * const name = context.properties.get("name");
     * context.properties.set("name", "New Name");
     * ```
     */
    readonly properties: ReactiveMap<string, unknown>;

    /**
     * Returns all feature properties as a plain JavaScript object.
     *
     * Converts the reactive properties map to a standard object with string keys and unknown
     * values. Useful when you need to pass properties to functions that expect plain objects.
     *
     * @returns A plain object containing all feature properties (excluding geometry).
     */
    readonly propertiesObject: () => Readonly<Record<string, unknown>>;

    /**
     * The current editing step containing the feature and associated metadata.
     *
     * Provides access to the complete editing step, which can be either a {@link CreationStep}
     * or {@link UpdateStep}.
     */
    readonly editingStep: ModificationStep;

    /**
     * The current editing mode.
     *
     * Returns `"create"` when creating a new feature, or `"update"` when editing an existing
     * feature. Use this to conditionally render different UI or apply different logic based on the
     * editing mode.
     */
    readonly mode: Mode;

    /**
     * The feature template used to create the feature, if in creation mode.
     *
     * Returns the {@link FeatureTemplate} when creating a new feature (`mode === "create"`), or
     * `undefined` when editing an existing feature (`mode === "update"`).
     */
    readonly template: FeatureTemplate | undefined;

    /**
     * The layer containing the feature being edited, if in update mode.
     *
     * Returns the {@link Layer} when editing an existing feature (`mode === "update"`), or
     * `undefined` when creating a new feature (`mode === "create"`) or if the layer is not
     * available.
     */
    readonly layer: Layer | undefined;

    /**
     * Whether the form is currently valid.
     *
     * Controls the enabled state of the save button in the property editor. Set this to `true`
     * when the form passes validation, or `false` when there are validation errors. For
     * declarative forms, this is managed automatically based on field validation rules.
     */
    isValid: boolean;
}

/**
 * The editing mode for a feature.
 *
 * - `"create"`: Creating a new feature
 * - `"update"`: Editing an existing feature
 */
export type Mode = "create" | "update";
