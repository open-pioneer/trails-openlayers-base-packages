// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Layer } from "@open-pioneer/map";
import type { Feature } from "ol";
import type { Type as GeometryType } from "ol/geom/Geometry";
import type { ReactNode } from "react";

import type { DrawingOptions } from "./InteractionOptions";
import type { FieldConfig } from "../fields/FieldConfig";
import type { PropertyFormContext } from "../editor/context";

/**
 * Base interface for feature template configuration.
 *
 * Defines the common properties shared by all feature templates, including geometry type,
 * layer association, and drawing options. Feature templates are used to create new features
 * with predefined configurations.
 *
 * This interface is combined with {@link FormTemplate} to create a complete
 * {@link FeatureTemplate}.
 */
export interface BaseFeatureTemplate {
    /**
     * The display name of the feature template.
     *
     * Shown in the UI when selecting a template. After selection, used as the header text
     * displayed above the form fields in the editor component.
     */
    readonly name: string;

    /**
     * The geometry type for features created with this template.
     *
     * Determines the type of geometry that can be drawn: `"Point"`, `"LineString"`, `"Polygon"`,
     * `"Circle"`, etc.
     */
    readonly geometryType: GeometryType;

    /**
     * Optional icon to display alongside the template name in the UI.
     *
     * Can be a React node (e.g., an icon component) or `null` to hide the icon. If `undefined`,
     * a default icon is used.
     */
    readonly icon?: ReactNode | null;

    /**
     * The ID of the layer associated with this feature template.
     *
     * Primarily used to determine which form template to display when editing features from a
     * specific layer. By default, when a feature is selected for editing, the first template
     * with a `layerId` matching the feature's layer ID is chosen to configure the property form.
     * This behavior can be customized by providing a custom {@link FormTemplateProvider}.
     */
    readonly layerId?: string;

    /**
     * Default property values for features created with this template.
     *
     * These properties are applied to new features before the user edits them. Useful for setting
     * default attribute values or metadata.
     */
    readonly prototype?: Record<string, unknown>;

    /**
     * Additional options to configure the drawing interaction.
     *
     * See {@link DrawingOptions} for available configuration options. These are passed to the
     * OpenLayers `Draw` interaction when creating features.
     */
    readonly drawingOptions?: DrawingOptions;
}

/**
 * Form template using a declarative field configuration approach.
 *
 * Defines a form using an array of field configurations. Each field in the `fields` array
 * specifies the type of input control (text field, checkbox, select, etc.) and its properties.
 * The form is automatically rendered based on these configurations.
 *
 * This is the recommended approach for most use cases as it provides a structured, declarative
 * way to define forms without writing custom rendering logic.
 */
export interface DeclarativeFormTemplate {
    /** Identifies this as a declarative form template. */
    readonly kind: "declarative";

    /**
     * Optional header text displayed in the editor component.
     *
     * When provided, this name is shown as a header above the form fields. If `undefined`,
     * a default header will be used.
     */
    readonly name?: string;

    /** Array of field configurations defining the form's input controls. */
    readonly fields: FieldConfig[];
}

/**
 * Form template using a custom rendering function.
 *
 * Provides complete control over form rendering by allowing you to supply a custom React
 * component. Use this when you need advanced form layouts, custom validation logic, or
 * specialized UI components that cannot be expressed through declarative field configurations.
 *
 * The render function should use {@link PropertyFormContext} to read and update feature properties.
 */
export interface DynamicFormTemplate {
    /** Identifies this as a dynamic form template. */
    readonly kind: "dynamic";

    /**
     * Optional header text displayed in the editor component.
     *
     * When provided, this name is shown as a header above the form. If `undefined`,
     * a default header will be used.
     */
    readonly name?: string;

    /**
     * Function that renders the custom form content.
     *
     * Should return a React element representing the form UI. The function can use React hooks
     * and {@link PropertyFormContext} to interact with feature properties.
     */
    readonly renderForm: () => ReactNode;
}

/**
 * Union type representing either declarative or dynamic form templates.
 *
 * Form templates define how feature properties are edited. Choose {@link DeclarativeFormTemplate}
 * for standard forms with predefined field types, or {@link DynamicFormTemplate} for custom
 * form rendering logic.
 */
export type FormTemplate = DeclarativeFormTemplate | DynamicFormTemplate;

/**
 * Complete feature template combining geometry configuration with form template.
 *
 * A feature template provides all the information needed to create and edit features, including
 * - geometry type and drawing options ({@link BaseFeatureTemplate}),
 * - form configuration for editing properties ({@link FormTemplate}).
 *
 * Feature templates are used throughout the editing workflow to determine how features are
 * created, displayed, and edited.
 *
 * @example
 * ```ts
 * const pointTemplate: FeatureTemplate = {
 *     name: "Point of Interest",
 *     kind: "declarative",
 *     geometryType: "Point",
 *     layerId: "poi-layer",
 *     fields: [
 *         { label: "Name", type: "text-field", propertyName: "name", isRequired: true },
 *         { label: "Description", type: "text-area", propertyName: "description" }
 *     ]
 * };
 * ```
 */
export type FeatureTemplate = BaseFeatureTemplate & FormTemplate;

/**
 * Function type for providing a form template for a given feature and layer.
 *
 * This callback is used to determine which form template should be used when editing a feature's
 * properties. It receives the feature being edited and its associated layer, and returns the
 * appropriate {@link FormTemplate} to display, or `undefined` if no template is available.
 *
 * Typically used during the update workflow to dynamically determine the form configuration based
 * on the feature's layer or other characteristics.
 *
 * @param feature - The OpenLayers feature being edited.
 * @param layer - The layer containing the feature, or `undefined` if not available.
 * @returns The form template to use for editing the feature's properties, or `undefined` if no
 * template is available.
 */
export type FormTemplateProvider = (
    feature: Feature,
    layer: Layer | undefined
) => FormTemplate | undefined;
