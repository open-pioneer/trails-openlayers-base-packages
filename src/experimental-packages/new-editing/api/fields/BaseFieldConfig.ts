// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/**
 * Base interface for field configuration properties.
 *
 * Defines common properties shared by all field types in declarative forms. Each field is bound to
 * a feature property and provides various options for controlling visibility, validation, and
 * user interaction.
 *
 * All boolean and text properties can be either static values or functions that compute values
 * dynamically based on the current feature properties, enabling conditional field behavior.
 */
export interface BaseFieldConfig {
    /**
     * The display label shown for the field.
     *
     * Displayed above the input control to indicate what the field represents.
     */
    readonly label: string;

    /**
     * The name of the feature property this field edits.
     *
     * Used to read and write the field's value from the feature's properties. Must match the
     * property name on the feature being edited.
     */
    readonly propertyName: string;

    /**
     * Whether the field is required.
     *
     * When `true`, displays a required indicator and validates that the field has a value.
     * Can be a function to determine required status dynamically based on other properties.
     *
     * @default false
     */
    readonly isRequired?: PropertyFunctionOr<boolean>;

    /**
     * Whether the field is enabled for user input.
     *
     * When `false`, the field is disabled and the user cannot modify its value. Can be a function
     * to enable/disable the field dynamically based on other properties.
     *
     * @default true
     */
    readonly isEnabled?: PropertyFunctionOr<boolean>;

    /**
     * Whether the field is visible in the form.
     *
     * When `false`, the field is completely hidden. Can be a function to show/hide the field
     * dynamically based on other properties.
     *
     * @default true
     */
    readonly isVisible?: PropertyFunctionOr<boolean>;

    /**
     * Whether the field's current value is valid.
     *
     * When `false`, displays the field in an error state and shows the error text if provided.
     * Can be a function to validate the field dynamically based on its value and other properties.
     *
     * @default true
     */
    readonly isValid?: PropertyFunctionOr<boolean>;

    /**
     * Error message to display when the field is invalid.
     *
     * Shown below the field when {@link isValid} is `false`. Can be a function to provide
     * dynamic error messages based on the validation context.
     */
    readonly errorText?: PropertyFunctionOr<string | undefined>;

    /**
     * Helper text to guide the user.
     *
     * Shown below the field to provide additional context or instructions. Can be a function to
     * provide dynamic help text based on the field's state.
     */
    readonly helperText?: PropertyFunctionOr<string | undefined>;
}

/**
 * Type representing a value that can be either static or computed dynamically from feature
 * properties.
 *
 * @template T - The type of the value
 */
export type PropertyFunctionOr<T> = T | PropertyFunction<T>;

/**
 * Function that computes a value based on the current feature properties.
 *
 * @template T - The return type
 * @param properties - Current feature properties
 * @returns The computed value
 */
export type PropertyFunction<T> = (properties: Readonly<Record<string, unknown>>) => T;
