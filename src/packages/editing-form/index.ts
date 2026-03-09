// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

// =================================================================
// Editor and property form context
// =================================================================
export { Editor, type EditorProps, type FormTemplateContext } from "./api/editor/editor";
export { usePropertyFormContext, type Mode, type PropertyFormContext } from "./api/editor/context";

// =================================================================
// Editing model types
// =================================================================
export type {
    EditingStorage,
    AddFeatureOptions,
    DeleteFeatureOptions,
    UpdateFeatureOptions
} from "./api/model/EditingStorage";

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
    FormTemplate
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
