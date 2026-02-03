// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive, reactiveMap, type ReactiveMap } from "@conterra/reactivity-core";
import type { Layer } from "@open-pioneer/map";

import { createContext } from "react";
import type { Feature } from "ol";

import type { FeatureTemplate } from "../../api/model/FeatureTemplate";
import type { ModificationStep } from "../../api/model/EditingStep";
import type { Mode, PropertyFormContext } from "../../api/editor/context";

export class PropertyFormContextClass implements PropertyFormContext {
    constructor(private readonly modificationStep: ModificationStep) {
        const entries = PropertyFormContextClass.getPropertyEntries(modificationStep.feature);
        this.propertiesMap = reactiveMap(entries);
    }

    propertiesObject(): Readonly<Record<string, unknown>> {
        const entries = this.properties.entries();
        return Object.fromEntries(entries);
    }

    get feature(): Feature {
        return this.editingStep.feature;
    }

    get mode(): Mode {
        return this.editingStep.id === "create-modify" ? "create" : "update";
    }

    get editingStep(): ModificationStep {
        return this.modificationStep;
    }

    get properties(): ReactiveMap<string, unknown> {
        return this.propertiesMap;
    }

    get isValid(): boolean {
        return this.isValidSignal.value;
    }

    set isValid(value: boolean) {
        this.isValidSignal.value = value;
    }

    get template(): FeatureTemplate | undefined {
        return this.editingStep.id === "create-modify" ? this.editingStep.template : undefined;
    }

    get layer(): Layer | undefined {
        return this.editingStep.id === "update-modify" ? this.editingStep.layer : undefined;
    }

    private static getPropertyEntries(feature: Feature): [string, unknown][] {
        const properties = feature.getProperties();
        const geometryName = feature.getGeometryName();
        return Object.entries(properties).filter(([key, _]) => key !== geometryName);
    }

    private readonly propertiesMap: ReactiveMap<string, unknown>;
    private readonly isValidSignal = reactive(false);
}

export const PropertyFormContextObject = createContext<PropertyFormContextClass | undefined>(
    undefined
);
