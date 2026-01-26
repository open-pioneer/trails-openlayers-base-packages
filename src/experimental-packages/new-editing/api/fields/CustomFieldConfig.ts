// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { ReactNode } from "react";
import type { BaseFieldConfig } from "./BaseFieldConfig";

/**
 * Configuration for a custom field with user-provided rendering.
 *
 * Allows complete control over the field's UI by providing a custom render function. Use this
 * when none of the built-in field types meet your requirements and you need full control over
 * the field's appearance and behavior.
 *
 * The render function receives the current field value and a callback to update it, and must
 * return a React node to display in the form.
 */
export interface CustomFieldConfig extends BaseFieldConfig {
    /** Identifies this as a custom field. */
    readonly type: "custom";

    /**
     * Function that renders the custom field control.
     *
     * @param value - The current value of the field from the feature properties
     * @param onChange - Callback to update the field value
     * @returns React element(s) to render for this field
     *
     * @example
     * ```tsx
     * render: (value, onChange) => (
     *     <input
     *         type="range"
     *         value={value as number}
     *         onChange={(e) => onChange(Number(e.target.value))}
     *     />
     * )
     * ```
     */
    readonly render: (value: unknown, onChange: OnCustomFieldChange) => ReactNode;
}

/**
 * Callback function for updating a custom field's value.
 *
 * Called by custom field rendering logic to update the field's value in the feature properties.
 *
 * @param newValue - The new value to set for the field
 */
export type OnCustomFieldChange = (newValue: unknown) => void;
