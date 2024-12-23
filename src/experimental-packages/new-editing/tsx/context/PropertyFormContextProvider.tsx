// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useMemo, useState, type ReactElement, type ReactNode } from "react";
import {
    PropertyFormContext, type PropertyFormContextType, type Properties, type PropertySetter
} from "./PropertyFormContext";
import type { ModificationStep } from "../model/EditingStep";

export function PropertyFormContextProvider(
    { children, editingStep }: PropertyFormContextProviderProps
): ReactElement {
    const contextValue = useContextValue(editingStep);

    return (
        <PropertyFormContext.Provider value={contextValue}>
            {children}
        </PropertyFormContext.Provider>
    );
}

function useContextValue(editingStep: ModificationStep): PropertyFormContextType {
    const [isValid, setValid] = useState(false);

    const [properties, setProperties] = useState<Properties>(() => {
        return { ...editingStep.feature.getProperties() };
    });

    const setProperty = useCallback<PropertySetter>((key, value) => {
        setProperties((properties) => ({ ...properties, [key]: value }));
    }, []);

    return useMemo(() => {
        if (editingStep.id === "create-modify") {
            return {
                mode: "create",
                feature: editingStep.feature,
                template: editingStep.template,
                layer: undefined,
                properties,
                setProperty,
                setProperties,
                isValid,
                setValid
            };
        } else {
            return {
                mode: "update",
                feature: editingStep.feature,
                template: undefined,
                layer: editingStep.layer,
                properties,
                setProperty,
                setProperties,
                isValid,
                setValid
            };
        }
    }, [editingStep, isValid, properties, setProperty]);
}

interface PropertyFormContextProviderProps {
    readonly children: ReactNode;
    readonly editingStep: ModificationStep;
}
