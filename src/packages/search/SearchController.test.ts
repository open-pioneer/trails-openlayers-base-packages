// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, vi, it } from "vitest";
import { SearchController } from "./SearchController";
import { DataSource } from "./api";
import { FakeCitySource, FakeRejectionSource, FakeRiverSource } from "./testSources";
import { isAbortError } from "@open-pioneer/core";

const FAKE_REQUEST_TIMER = 0;

afterEach(() => {
    vi.restoreAllMocks();
});

it("except controller to return result with suggestions from one source", async () => {
    const expected = [
        {
            label: "Cities",
            suggestions: [{ "id": 0, label: "Aachen" }]
        },
        {
            label: "Rivers",
            suggestions: []
        }
    ];
    const controller = setup([
        new FakeCitySource(FAKE_REQUEST_TIMER),
        new FakeRiverSource(FAKE_REQUEST_TIMER)
    ]);
    const searchResponse = await controller.search("Aachen");

    expect(expected).toStrictEqual(searchResponse);
});

it("except controller to return result with suggestions from multiple sources", async () => {
    const expected = [
        {
            label: "Cities",
            suggestions: [{ "id": 0, "label": "Aachen" }]
        },
        {
            label: "Rivers",
            suggestions: [
                {
                    "id": 0,
                    "label": "Maas"
                }
            ]
        }
    ];
    const controller = setup([
        new FakeCitySource(FAKE_REQUEST_TIMER),
        new FakeRiverSource(FAKE_REQUEST_TIMER)
    ]);

    const searchResponse = await controller.search("aa");

    expect(searchResponse).toStrictEqual(expected);
});

it("expect controller to filter rejected queries and return only successfully resolved ones", async () => {
    const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
    const expected = [
        {
            label: "Cities",
            suggestions: [{ "id": 0, "label": "Aachen" }]
        }
    ];
    const controller = setup([new FakeCitySource(FAKE_REQUEST_TIMER), new FakeRejectionSource()]);

    const searchResponse = await controller.search("aa");
    expect(expected).toStrictEqual(searchResponse);
    expect(logSpy).toMatchInlineSnapshot(`
      [MockFunction error] {
        "calls": [
          [
            "[ERROR] search:SearchController: search for source Rejected failed",
            [Error: search with aa rejected],
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
});

it("expect controller to call AbortController when typing quickly", async () => {
    const expected = [
        {
            label: "Cities",
            suggestions: [{ "id": 0, "label": "Aachen" }]
        }
    ];
    const controller = setup([new FakeCitySource(FAKE_REQUEST_TIMER)]);

    let cancelled = false;
    const firstSearch = controller.search("a").catch((e) => (cancelled = !!isAbortError(e)));
    const searchResponse = await controller.search("aa");
    expect(expected).toStrictEqual(searchResponse);

    await firstSearch;
    expect(cancelled).toBe(true);
});

function setup(sources: DataSource[]) {
    const controller = new SearchController({
        sources,
        searchTypingDelay: 10
    });
    return controller;
}
