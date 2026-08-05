// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { SearchSource } from "../api";
import { useSearchSourceId } from "./useSearchSourceId";

it("uses the source's own id if it has one", () => {
    const getSourceId = renderIdHook();
    expect(getSourceId(createSource("Source", "my-id"))).toBe("my-id");
});

it("generates stable ids for sources without an id", () => {
    const getSourceId = renderIdHook();
    const source = createSource("Source");

    const id = getSourceId(source);
    expect(id).toBeTruthy();
    expect(getSourceId(source)).toBe(id);
});

it("generates distinct ids for distinct sources", () => {
    const getSourceId = renderIdHook();
    const id1 = getSourceId(createSource("Source 1"));
    const id2 = getSourceId(createSource("Source 2"));
    expect(id1).not.toBe(id2);
});

it("generates distinct ids for sources that share a label", () => {
    const getSourceId = renderIdHook();
    const id1 = getSourceId(createSource("Cities"));
    const id2 = getSourceId(createSource("Cities"));
    expect(id1).not.toBe(id2);
});

it("returns the same function across re-renders", () => {
    const { result, rerender } = renderHook(() => useSearchSourceId());
    const getSourceId = result.current;
    const source = createSource("Source");
    const id = getSourceId(source);

    rerender();
    expect(result.current).toBe(getSourceId);
    expect(result.current(source)).toBe(id);
});

function renderIdHook() {
    return renderHook(() => useSearchSourceId()).result.current;
}

function createSource(label: string, id?: string): SearchSource {
    return { id, label, search: async () => [] };
}
