// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    computed,
    reactive,
    reactiveMap,
    ReadonlyReactive,
    type ReactiveMap
} from "@conterra/reactivity-core";
import type { Layer } from "@open-pioneer/map";
import type { Feature } from "ol";
import { createContext } from "react";
import type { Mode } from "../../api/editor/context";
import { PropertyFunctionOr } from "../../api/fields/BaseFieldConfig";
import { FieldConfig } from "../../api/fields/FieldConfig";
import type { ModificationStep } from "../../api/model/EditingStep";
import type {
    DeclarativeFormTemplate,
    FeatureTemplate,
    FormTemplate
} from "../../api/model/FeatureTemplate";
import { EditingCallbacks } from "../editor/useEditingCallbacks";

export abstract class BaseFormContext {
    readonly #propertiesMap: ReactiveMap<string, unknown>;
    readonly #modificationStep: ModificationStep;
    readonly #formTemplate: FormTemplate; // TODO
    readonly #propsAsObject: ReadonlyReactive<Record<string, unknown>>;

    readonly callbacks: EditingCallbacks;

    constructor(
        modificationStep: ModificationStep,
        callbacks: EditingCallbacks,
        formTemplate: FormTemplate
    ) {
        this.#modificationStep = modificationStep;
        this.callbacks = callbacks;
        this.#formTemplate = formTemplate;

        const entries = BaseFormContext.getPropertyEntries(modificationStep.feature);
        this.#propertiesMap = reactiveMap(entries);
        this.#propsAsObject = computed(() => {
            const entries = this.properties.entries();
            const object = Object.fromEntries(entries);
            console.log(object);
            return object;
        });
    }

    getPropertiesAsObject(): Record<string, unknown> {
        return this.#propsAsObject.value;
    }

    get feature(): Feature {
        return this.editingStep.feature;
    }

    get mode(): Mode {
        return this.editingStep.id === "creation" ? "create" : "update";
    }

    get editingStep(): ModificationStep {
        return this.#modificationStep;
    }

    get properties(): ReactiveMap<string, unknown> {
        return this.#propertiesMap;
    }

    get formTemplate(): FormTemplate {
        return this.#formTemplate;
    }

    get template(): FeatureTemplate | undefined {
        return this.editingStep.id === "creation" ? this.editingStep.template : undefined;
    }

    get layer(): Layer | undefined {
        return this.editingStep.id === "update" ? this.editingStep.layer : undefined;
    }

    abstract get isValid(): boolean;
    abstract get hasRequiredFields(): boolean;

    private static getPropertyEntries(feature: Feature): [string, unknown][] {
        const properties = feature.getProperties();
        const geometryName = feature.getGeometryName();
        return Object.entries(properties).filter(([key, _]) => key !== geometryName);
    }
}

export class DeclarativeFormContext extends BaseFormContext {
    readonly #isValid: ReadonlyReactive<boolean>;
    readonly #hasRequiredFields: ReadonlyReactive<boolean>;

    constructor(
        modificationStep: ModificationStep,
        callbacks: EditingCallbacks,
        template: DeclarativeFormTemplate
    ) {
        super(modificationStep, callbacks, template);

        this.#isValid = computed(() => {
            const props = this.getPropertiesAsObject();
            return this.formTemplate.fields.every((field) => this.#isFieldValidImpl(field, props));
        });
        this.#hasRequiredFields = computed(() => {
            const props = this.getPropertiesAsObject();
            return this.formTemplate.fields.some((field) => isTrue(field.isRequired, props, false));
        });
    }

    isFieldValid(field: FieldConfig) {
        const props = this.getPropertiesAsObject();
        return this.#isFieldValidImpl(field, props);
    }

    #isFieldValidImpl(field: FieldConfig, props: Record<string, unknown>) {
        const isRequired = isTrue(field.isRequired, props, false);
        const isPresent = props[field.propertyName] != null;
        if (!isRequired && !isPresent) {
            return true;
        }

        if (isRequired && !isPresent) {
            return false;
        }

        // Perform user-defined validation first.
        if (!isTrue(field.isValid, props, true)) {
            return false;
        }

        // Fallback/default validation for builtin rules.
        if (field.type === "number-field") {
            const value = props[field.propertyName] as number | undefined;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (field.min != null && (!isPresent || value! < field.min)) {
                return false;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (field.max != null && (!isPresent || value! > field.max)) {
                return false;
            }
        }

        return true;
    }

    get isValid(): boolean {
        return this.#isValid.value;
    }

    override get formTemplate(): DeclarativeFormTemplate {
        // See constructor
        return super.formTemplate as DeclarativeFormTemplate;
    }

    get hasRequiredFields(): boolean {
        return this.#hasRequiredFields.value;
    }
}

export class CustomFormContext extends BaseFormContext {
    readonly #isValid = reactive(false);

    constructor(
        modificationStep: ModificationStep,
        callbacks: EditingCallbacks,
        template: FormTemplate
    ) {
        super(modificationStep, callbacks, template);
    }

    get isValid(): boolean {
        return this.#isValid.value;
    }

    set isValid(isValid: boolean) {
        this.#isValid.value = isValid;
    }

    get hasRequiredFields(): boolean {
        return false;
    }
}

export type AnyPropertyFormContext = DeclarativeFormContext | CustomFormContext;

export const FormContext = createContext<AnyPropertyFormContext | undefined>(undefined);

function isTrue(
    value: PropertyFunctionOr<boolean> | undefined,
    properties: Record<string, unknown>,
    defaultValue: boolean
): boolean {
    if (value == null) {
        return defaultValue;
    }
    return typeof value === "function" ? value(properties) : value;
}
