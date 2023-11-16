// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { DataSource, Suggestion } from "./api";
import { SearchGroupOption } from "./Search";

export function debounce<Args extends unknown[]>(
    delayedFunction: (...args: Args) => void,
    delay = 250
) {
    let timeout: NodeJS.Timeout | string | number | undefined;

    return (...args: Args) => {
        timeout && clearTimeout(timeout);
        timeout = setTimeout(() => {
            delayedFunction(...args);
        }, delay);
    };
}

export function mapSuggestions(
    suggestions: Suggestion[][],
    sources: DataSource[]
): SearchGroupOption[] {
    const options = sources.map((source, index) => ({
        label: source.label,
        options: suggestions[index]?.map((item) => ({ value: item.text, label: item.text })) || []
    }));
    return options;
}
