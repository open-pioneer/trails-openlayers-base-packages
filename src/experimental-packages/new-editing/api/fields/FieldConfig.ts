// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { CustomFieldConfig } from "./CustomFieldConfig";
import type { ComboBoxConfig, RadioGroupConfig, SelectConfig } from "./optionFieldConfigs";

import type {
    CheckBoxConfig,
    ColorPickerConfig,
    DatePickerConfig,
    NumberFieldConfig,
    SwitchConfig,
    TextAreaConfig,
    TextFieldConfig
} from "./standardFieldConfigs";

import type { DeclarativeFormTemplate } from "../model/FeatureTemplate";

/**
 * Union type of all available field configuration types.
 *
 * Use this type when defining fields in a {@link DeclarativeFormTemplate}. Each field type
 * provides different input controls and validation options for editing feature properties.
 */
export type FieldConfig =
    | CheckBoxConfig
    | ComboBoxConfig
    | CustomFieldConfig
    | ColorPickerConfig
    | DatePickerConfig
    | NumberFieldConfig
    | RadioGroupConfig
    | SelectConfig
    | SwitchConfig
    | TextAreaConfig
    | TextFieldConfig;

/**
 * Discriminator type for field configurations.
 *
 * Represents all possible values of the `type` property across all field configurations.
 */
export type FieldConfigType = FieldConfig["type"];
