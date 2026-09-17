// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from "vitest";
import { SearchResult, SearchSource } from "../api";
import { SearchOperationState } from "../model";
import { buildOptionGroups } from "./useComboboxCollection";
import { GetSearchSourceId } from "./useSearchSourceId";

it("creates one group per search source, with unique ids and option values", () => {
    const cities = createSource("Cities");
    const rivers = createSource("Rivers");
    const groups = buildOptionGroups(
        createSearchState([
            { source: cities, results: [{ id: 0, label: "Dortmund" }] },
            { source: rivers, results: [{ id: 0, label: "Rhein" }] }
        ]),
        getSourceId()
    );

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.label)).toEqual(["Cities", "Rivers"]);
    expect(groups.map((group) => group.source)).toEqual([cities, rivers]);
    expect(groups[0]!.id).not.toBe(groups[1]!.id);

    const values = groups.flatMap((group) => group.options).map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
});

it("turns results into options that link back to their source and group", () => {
    const cities = createSource("Cities");
    const result: SearchResult = { id: 7, label: "Dortmund" };
    const groups = buildOptionGroups(
        createSearchState([{ source: cities, results: [result] }]),
        getSourceId()
    );

    const group = groups[0]!;
    const option = group.options[0]!;
    expect(group.options).toHaveLength(1);
    expect(option.label).toBe("Dortmund");
    expect(option.source).toBe(cities);
    expect(option.result).toBe(result);
    expect(option.group).toBe(group);
});

it("returns no groups while the search is pending", () => {
    const cities = createSource("Cities");
    const groups = buildOptionGroups(
        {
            query: "Dort",
            pending: true,
            sourceResults: [{ source: cities, results: [{ id: 0, label: "Dortmund" }] }]
        },
        getSourceId()
    );

    expect(groups).toEqual([]);
});

function createSearchState(
    sourceResults: SearchOperationState["sourceResults"]
): SearchOperationState {
    return { query: "Dort", pending: false, sourceResults };
}

function createSource(label: string): SearchSource {
    return { label, search: async () => [] };
}

/** Assigns generated ids to sources in encounter order. */
function getSourceId(): GetSearchSourceId {
    const ids = new Map<SearchSource, string>();
    return (source) => {
        let id = ids.get(source);
        if (id == null) {
            id = `source-${ids.size}`;
            ids.set(source, id);
        }
        return id;
    };
}
