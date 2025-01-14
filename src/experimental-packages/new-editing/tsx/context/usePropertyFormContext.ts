// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useContext } from "react";
import {
    PropertyFormContext,
    type PropertyFormContextType,
    type Properties,
    type PropertySetter
} from "./PropertyFormContext";
import type { StatePair } from "../types/types";

export function usePropertyFormContext(): PropertyFormContextType {
    const context = useContext(PropertyFormContext);
    if (context != null) {
        return context;
    } else {
        throw new Error("No property form context available");
    }
}

export function useProperties(): [...StatePair<Properties>, PropertySetter] {
    const { properties, setProperties, setProperty } = usePropertyFormContext();
    return [properties, setProperties, setProperty];
}

export function useProperty(key: string): unknown {
    const { properties } = usePropertyFormContext();
    return properties[key];
}
