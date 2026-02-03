// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { BaseFieldConfig } from "./BaseFieldConfig";

/**
 * Configuration for a checkbox field.
 *
 * Renders a checkbox input that stores a boolean value in the feature property. Use this for
 * simple true/false properties.
 */
export interface CheckBoxConfig extends BaseFieldConfig {
    /** Identifies this as a checkbox field. */
    readonly type: "check-box";

    /**
     * Optional label to display next to the checkbox.
     *
     * If not provided, the main {@link BaseFieldConfig.label} is used.
     */
    readonly checkBoxLabel?: string;
}

/**
 * Configuration for a color picker field.
 *
 * Renders a color picker input that stores a color value (in hexadecimal format) in the feature
 * property. Includes an optional swatch palette for quick color selection.
 */
export interface ColorPickerConfig extends BaseFieldConfig {
    /** Identifies this as a color picker field. */
    readonly type: "color-picker";

    /**
     * Optional array of predefined colors to display as swatches.
     *
     * Colors should be specified as hex strings (e.g., `"#ff0000"` for red). When provided (and
     * not empty), displays a swatch palette allowing users to quickly select from these colors.
     */
    readonly swatchColors?: string[];
}

/**
 * Configuration for a date picker field.
 *
 * Renders a date or datetime input that stores a date string in the feature property. Use this
 * for date-based properties such as creation dates, deadlines, or event timestamps.
 */
export interface DatePickerConfig extends BaseFieldConfig {
    /** Identifies this as a date picker field. */
    readonly type: "date-picker";

    /**
     * Whether to include time selection in addition to the date.
     *
     * When `true`, renders a datetime picker allowing both date and time selection. When `false`
     * or `undefined`, only the date can be selected.
     *
     * @default false
     */
    readonly includeTime?: boolean;
}

/**
 * Configuration for a number field.
 *
 * Renders a numeric input that stores a number value in the feature property. Supports validation
 * constraints (min/max), precision control, and optional stepper buttons for incrementing/
 * decrementing the value.
 */
export interface NumberFieldConfig extends BaseFieldConfig {
    /** Identifies this as a number field. */
    readonly type: "number-field";

    /**
     * Placeholder text shown when the field is empty.
     *
     * Defaults to the field's {@link BaseFieldConfig.label}. Use an empty string to display no
     * placeholder.
     */
    readonly placeholder?: string;

    /** Minimum allowed value. Values below this will be rejected. */
    readonly min?: number;

    /** Maximum allowed value. Values above this will be rejected. */
    readonly max?: number;

    /**
     * Options for formatting the number value for display.
     *
     * Accepts any standard {@link Intl.NumberFormatOptions} such as `minimumFractionDigits`,
     * `maximumFractionDigits`, `style`, `currency`, etc. Use this to control how the number
     * is displayed to the user (e.g., as currency, percentage, or with specific decimal places).
     */
    readonly formatOptions?: Intl.NumberFormatOptions;

    /**
     * Increment/decrement step size when using stepper buttons.
     *
     * Determines how much the value changes when clicking the up/down arrows (if steppers are
     * enabled).
     */
    readonly step?: number;

    /**
     * Whether to show increment/decrement stepper buttons.
     *
     * When `true`, displays arrow buttons allowing the user to increment or decrement the value
     * by the configured step size.
     *
     * @default false
     */
    readonly showSteppers?: boolean;
}

/**
 * Configuration for a switch field.
 *
 * Renders a toggle switch input that stores a boolean value in the feature property. Similar to
 * a checkbox but with a different visual representation. Use this for boolean settings or on/off
 * states.
 */
export interface SwitchConfig extends BaseFieldConfig {
    /** Identifies this as a switch field. */
    readonly type: "switch";

    /**
     * Optional label to display next to the switch.
     *
     * If not provided, the main {@link BaseFieldConfig.label} is used.
     */
    readonly switchLabel?: string;
}

/**
 * Configuration for a multi-line text area field.
 *
 * Renders a textarea input that stores a string value in the feature property. Use this for
 * longer text content such as descriptions, comments, or notes that may span multiple lines.
 */
export interface TextAreaConfig extends BaseFieldConfig {
    /** Identifies this as a text area field. */
    readonly type: "text-area";

    /**
     * Placeholder text shown when the field is empty.
     *
     * Defaults to the field's {@link BaseFieldConfig.label}. Use an empty string to display no
     * placeholder.
     */
    readonly placeholder?: string;
}

/**
 * Configuration for a single-line text field.
 *
 * Renders a text input that stores a string value in the feature property. Use this for short
 * text content such as names, titles, or identifiers.
 */
export interface TextFieldConfig extends BaseFieldConfig {
    /** Identifies this as a text field. */
    readonly type: "text-field";

    /**
     * Placeholder text shown when the field is empty.
     *
     * Defaults to the field's {@link BaseFieldConfig.label}. Use an empty string to display no
     * placeholder.
     */
    readonly placeholder?: string;
}
