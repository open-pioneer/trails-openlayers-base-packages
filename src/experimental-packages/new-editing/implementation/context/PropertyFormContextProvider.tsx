// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMemo, type ReactElement, type ReactNode } from "react";
import { PropertyFormContextClass, PropertyFormContextObject } from "./PropertyFormContext";
import type { ModificationStep } from "../../api/model/EditingStep";

export function PropertyFormContextProvider({
    children,
    editingStep
}: PropertyFormContextProviderProps): ReactElement {
    const context = useMemo(() => new PropertyFormContextClass(editingStep), [editingStep]);

    return (
        <PropertyFormContextObject.Provider value={context}>
            {children}
        </PropertyFormContextObject.Provider>
    );
}

interface PropertyFormContextProviderProps {
    readonly children: ReactNode;
    readonly editingStep: ModificationStep;
}
