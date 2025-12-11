// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive, reactiveMap, type ReactiveMap } from "@conterra/reactivity-core";
import { createContext } from "react";
import type { Feature } from "ol";
import type { Layer } from "ol/layer";

import type { FeatureTemplate } from "../model/FeatureTemplate";
import type { ModificationStep } from "../model/EditingStep";

export class PropertyFormContext {
    constructor(readonly editingStep: ModificationStep) {
        const properties = editingStep.feature.getProperties();
        this.propertiesMap = reactiveMap(Object.entries(properties));
    }

    get feature(): Feature {
        return this.editingStep.feature;
    }

    get mode(): Mode {
        return this.editingStep.id === "create-modify" ? "create" : "update";
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
        return this.editingStep.id === "update-modify" ? this.editingStep.olLayer : undefined;
    }

    private readonly propertiesMap: ReactiveMap<string, unknown>;
    private readonly isValidSignal = reactive(false);
}

export const PropertyFormContextObject = createContext<PropertyFormContext | undefined>(undefined);

export type Mode = "create" | "update";
