// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
export { Editor, type EditorProps, type OnEditingStepChange } from "./Editor";

export { useEditing, type EditingOptions } from "./hooks/editing/useEditing";

export type {
    InteractionOptions,
    DrawOptions,
    SelectOptions,
    ModifyOptions,
    SnapOptions,
    HighlightOptions
} from "./hooks/editing/controller/EditingController";

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

export type { EditingState } from "./model/EditingState";

export type {
    FeatureTemplate,
    CheckBoxInput,
    ColorInput,
    DateInput,
    FieldInput,
    InputType,
    NumberInput,
    SelectInput,
    TextAreaInput,
    TextFieldInput
} from "./model/FeatureTemplate";

export type { EditingStep } from "./model/EditingStep";
