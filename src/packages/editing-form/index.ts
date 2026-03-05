// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

// =================================================================
// Editor, property form context, and editing hook
// =================================================================
export { Editor, type EditorProps, type OnEditingStepChange } from "./api/editor/editor";
export { usePropertyFormContext, type Mode, type PropertyFormContext } from "./api/editor/context";
export { useEditing, type EditingOptions } from "./api/editor/editing";

// =================================================================
// Editing model types
// =================================================================
export type { DrawingActions, DrawingCapabilities, DrawingState } from "./api/model/DrawingState";

export type {
    AddFeatureHandler,
    DeleteFeatureHandler,
    EditingHandler,
    UpdateFeatureHandler
} from "./api/model/EditingHandler";

export type {
    CreationStep,
    DrawingStep,
    EditingStep,
    InitialStep,
    ModificationStep,
    SelectionStep,
    UpdateStep
} from "./api/model/EditingStep";

export type {
    BaseFeatureTemplate,
    DeclarativeFormTemplate,
    DynamicFormTemplate,
    FeatureTemplate,
    FormTemplate,
    FormTemplateProvider
} from "./api/model/FeatureTemplate";

export type {
    DrawingOptions,
    InteractionOptions,
    ModificationOptions,
    SelectionOptions,
    SnappingOptions
} from "./api/model/InteractionOptions";

// =================================================================
// Field configurations
// =================================================================
export type { FieldConfig, FieldConfigType } from "./api/fields/FieldConfig";
export type { PropertyFunction, PropertyFunctionOr } from "./api/fields/BaseFieldConfig";
export type { CustomFieldConfig, OnCustomFieldChange } from "./api/fields/CustomFieldConfig";

export type {
    ComboBoxConfig,
    RadioGroupConfig,
    SelectConfig,
    Option
} from "./api/fields/optionFieldConfigs";

export type {
    CheckBoxConfig,
    ColorPickerConfig,
    DatePickerConfig,
    NumberFieldConfig,
    SwitchConfig,
    TextAreaConfig,
    TextFieldConfig
} from "./api/fields/standardFieldConfigs";
