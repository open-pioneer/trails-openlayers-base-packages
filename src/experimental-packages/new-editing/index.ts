// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
export { Editor, type EditorProps, type OnEditingStepChange } from "./tsx/Editor";

export {
    useEditing,
    type Editing,
    type EditingOptions,
    type InteractionOptions,
    type ModifyOptions,
    type SelectOptions,
    type SnapOptions
} from "./tsx/hooks/editing/useEditing";

export {
    usePropertyFormContext,
    useProperties,
    useProperty
} from "./tsx/context/usePropertyFormContext";

export type {
    PropertyFormContext,
    Properties,
    PropertySetter
} from "./tsx/context/PropertyFormContext";

export {
    DefaultPropertyForm,
    type DefaultPropertyFormProps,
    type FieldInputsProvider
} from "./tsx/components/form/DefaultPropertyForm";

export {
    DefaultInputControl,
    type DefaultInputControlProps
} from "./tsx/components/form/DefaultInputControl";

export type {
    EditingHandler,
    AddFeatureHandler,
    DeleteFeatureHandler,
    UpdateFeatureHandler
} from "./tsx/model/EditingHandler";

export type {
    CheckBoxInput,
    ColorInput,
    DateInput,
    DrawOptions,
    FeatureTemplate,
    FieldInput,
    InputType,
    NumberInput,
    SelectInput,
    TextAreaInput,
    TextFieldInput
} from "./tsx/model/FeatureTemplate";

export type { EditingStep } from "./tsx/model/EditingStep";
