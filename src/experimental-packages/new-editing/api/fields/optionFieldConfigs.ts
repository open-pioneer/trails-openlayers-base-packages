// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { BaseFieldConfig } from "./BaseFieldConfig";

/**
 * Configuration for a combo box field.
 *
 * Renders a searchable combo box input that allows users to select from a list of options. The
 * field can store either string or number values depending on the {@link valueType} property.
 */
export type ComboBoxConfig = BaseComboBoxConfig & (StringOptions | NumberOptions);

/**
 * Configuration for a select field.
 *
 * Renders a dropdown select input that allows users to choose from a list of predefined options.
 * The field can store either string or number values depending on the {@link valueType} property.
 */
export type SelectConfig = BaseSelectConfig & (StringOptions | NumberOptions);

/**
 * Configuration for a radio group field.
 *
 * Renders a group of radio buttons that allows users to select a single option from a list. The
 * field can store either string or number values depending on the {@link valueType} property.
 */
export type RadioGroupConfig = BaseRadioGroupConfig & (StringOptions | NumberOptions);

interface BaseComboBoxConfig extends BaseFieldConfig {
    /** Identifies this as a combo box field. */
    readonly type: "combo-box";

    /**
     * Placeholder text shown when the field is empty.
     *
     * Defaults to the field's {@link BaseFieldConfig.label}. Use an empty string to display no
     * placeholder.
     */
    readonly placeholder?: string;

    /**
     * Whether to show a button to clear the current selection.
     *
     * When `true`, displays a clear button that allows users to reset the field value to
     * `undefined`. Defaults to `true` for optional fields and `false` for required fields.
     *
     * @default !isRequired
     */
    readonly showClearTrigger?: boolean;
}

interface BaseSelectConfig extends BaseFieldConfig {
    /** Identifies this as a select field. */
    readonly type: "select";

    /**
     * Placeholder text shown when the field is empty.
     *
     * Defaults to the field's {@link BaseFieldConfig.label}. Use an empty string to display no
     * placeholder.
     */
    readonly placeholder?: string;

    /**
     * Whether to show a button to clear the current selection.
     *
     * When `true`, displays a clear button that allows users to reset the field value to
     * `undefined`. Defaults to `true` for optional fields and `false` for required fields.
     *
     * @default !isRequired
     */
    readonly showClearTrigger?: boolean;
}

interface BaseRadioGroupConfig extends BaseFieldConfig {
    /** Identifies this as a radio group field. */
    readonly type: "radio-group";
}

interface StringOptions {
    /** Indicates that option values are strings. */
    readonly valueType: "string";

    /** Array of available options for the field. */
    readonly options: Option<string>[];
}

interface NumberOptions {
    /** Indicates that option values are numbers. */
    readonly valueType: "number";

    /** Array of available options for the field. */
    readonly options: Option<number>[];
}

/**
 * Represents a single option in a selection field (combo box, select, or radio group).
 *
 * @template T - The type of the option value (string or number)
 */
export interface Option<T> {
    /** The display text shown to the user. */
    readonly label: string;

    /** The underlying value stored in the feature property when this option is selected. */
    readonly value: T;
}
