// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
export { Editor, type EditorProps, type OnEditingStepChange } from "./Editor";

export {
    useEditing,
    type Editing,
    type EditingOptions,
    type InteractionOptions,
    type ModifyOptions,
    type SelectOptions,
    type SnapOptions
} from "./hooks/editing/useEditing";

export {
    usePropertyFormContext,
    useProperties,
    useProperty
} from "./context/usePropertyFormContext";

export type {
    PropertyFormContextType,
    Properties,
    PropertySetter
} from "./context/PropertyFormContext";

export {
    DefaultPropertyForm,
    type DefaultPropertyFormProps,
    type FieldInputsProvider
} from "./components/form/DefaultPropertyForm";

export {
    DefaultInputControl,
    type DefaultInputControlProps
} from "./components/form/DefaultInputControl";

export type {
    EditingHandler,
    AddFeatureHandler,
    DeleteFeatureHandler,
    UpdateFeatureHandler
} from "./model/EditingHandler";

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
} from "./model/FeatureTemplate";

export type { EditingStep } from "./model/EditingStep";
