// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useContext } from "react";
import { FormContext, type AnyPropertyFormContext } from "./PropertyFormContext";

export function usePropertyFormContext(): AnyPropertyFormContext {
    const context = useContext(FormContext);
    if (context != null) {
        return context;
    } else {
        throw new Error("No property form context available");
    }
}
