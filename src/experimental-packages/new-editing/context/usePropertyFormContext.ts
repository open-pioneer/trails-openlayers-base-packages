// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useContext } from "react";
import { PropertyFormContextObject, type PropertyFormContext } from "./PropertyFormContext";

export function usePropertyFormContext(): PropertyFormContext {
    const context = useContext(PropertyFormContextObject);
    if (context != null) {
        return context;
    } else {
        throw new Error("No property form context available");
    }
}
