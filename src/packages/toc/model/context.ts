// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createContext, Provider, useContext } from "react";
import { TocModel } from "./TocModel";

const TocModelContext = createContext<TocModel | undefined>(undefined);

/**
 * Provider for the toc's shared model.
 * Used at the root of the component.
 */
export const TocModelProvider: Provider<TocModel> = TocModelContext.Provider as Provider<TocModel>;

/**
 * Returns the shared model for the current toc component.
 */
export function useTocModel(): TocModel {
    const model = useContext(TocModelContext);
    if (!model) {
        throw new Error("Internal error: TocModel not found in context.");
    }
    return model;
}
