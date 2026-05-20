// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useContext } from "react";
import {
    CustomFormContext,
    DeclarativeFormContext,
    FormContext,
    type AnyPropertyFormContext
} from "./PropertyFormContext";

/**
 * Used by the property editor, internally.
 *
 * @internal
 */
export function usePropertyFormContext(): AnyPropertyFormContext {
    const context = useContext(FormContext);
    if (context != null) {
        return context;
    } else {
        throw new Error("No property form context available");
    }
}

/**
 * Used by the property editor, internally.
 *
 * @internal
 */
export function useDeclarativeFormContext(): DeclarativeFormContext {
    const value = usePropertyFormContext();
    if (!(value instanceof DeclarativeFormContext)) {
        throw new Error("No declarative form context available");
    }
    return value;
}

/**
 * Used for custom form contents.
 */
export function useCustomFormContext(): CustomFormContext {
    const value = usePropertyFormContext();
    if (!(value instanceof CustomFormContext)) {
        throw new Error("No custom form context available");
    }
    return value;
}
