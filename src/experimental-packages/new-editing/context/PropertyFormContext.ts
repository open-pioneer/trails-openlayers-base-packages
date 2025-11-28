// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Feature } from "ol";
import type { Layer } from "ol/layer";
import { createContext } from "react";

import type { FeatureTemplate } from "../model/FeatureTemplate";
import type { StateSetter } from "../types/types";

export const PropertyFormContext = createContext<PropertyFormContextType | undefined>(undefined);

interface BaseContext {
    readonly feature: Feature;
    readonly properties: Properties;
    readonly setProperty: PropertySetter;
    readonly setProperties: StateSetter<Properties>;
    readonly isValid: boolean;
    readonly setValid: StateSetter<boolean>;
}

export interface CreationContext extends BaseContext {
    readonly mode: "create";
    readonly template: FeatureTemplate;
    readonly layer: undefined;
}

export interface UpdateContext extends BaseContext {
    readonly mode: "update";
    readonly template: undefined;
    readonly layer: Layer | undefined;
}

export type PropertyFormContextType = CreationContext | UpdateContext;
export type PropertySetter = (key: string, value: unknown) => void;
export type Properties = Record<string, unknown>;
