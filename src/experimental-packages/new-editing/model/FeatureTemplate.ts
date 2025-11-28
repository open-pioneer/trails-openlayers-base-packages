// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Type as GeometryType } from "ol/geom/Geometry";
import type { Options } from "ol/interaction/Draw";
import type { ReactNode } from "react";

export interface FeatureTemplate<P = Record<string, unknown>> {
    readonly id: string;
    readonly name: string;
    readonly geometryType: GeometryType;
    readonly icon?: ReactNode | null;
    readonly prototype?: P;
    readonly fieldInputs?: FieldInput[];
    readonly drawOptions?: DrawOptions;
}

export type DrawOptions = Omit<Options, "source" | "type">;

interface BaseInput {
    readonly inputType: string; // More precise in concrete union variants
    readonly label: string;
    readonly fieldName: string;
    readonly required?: boolean;
}

export interface TextFieldInput extends BaseInput {
    readonly inputType: "textField";
    readonly placeholder?: string;
}

export interface TextAreaInput extends BaseInput {
    readonly inputType: "textArea";
    readonly placeholder?: string;
}

export interface NumberInput extends BaseInput {
    readonly inputType: "number";
    readonly placeholder?: string;
    readonly min?: number;
    readonly max?: number;
    readonly precision?: number;
    readonly step?: number;
    readonly showSteppers?: boolean;
}

export interface CheckBoxInput extends BaseInput {
    readonly inputType: "checkBox";
    readonly checkBoxLabel?: string;
}

export interface StringSelectInput extends BaseInput {
    readonly inputType: "select";
    readonly valueType: "string";
    readonly options: SelectOption<string>[];
}

export interface NumberSelectInput extends BaseInput {
    readonly inputType: "select";
    readonly valueType: "number";
    readonly options: SelectOption<number>[];
}

export type SelectInput = StringSelectInput | NumberSelectInput;

export interface SelectOption<T> {
    readonly label: string;
    readonly value: T;
}

export interface DateInput extends BaseInput {
    readonly inputType: "date";
    readonly placeholder?: string;
}

export interface ColorInput extends BaseInput {
    readonly inputType: "color";
    readonly colors?: string[];
}

export type FieldInput =
    | TextFieldInput
    | TextAreaInput
    | NumberInput
    | CheckBoxInput
    | SelectInput
    | DateInput
    | ColorInput;

export type InputType = FieldInput["inputType"];
