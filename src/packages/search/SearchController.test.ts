// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, vi, it } from "vitest";
import { SearchController } from "./SearchController";
import { SearchSource } from "./api";
import { FakeCitySource, FakeRejectionSource, FakeRiverSource } from "./testSources";
import { isAbortError } from "@open-pioneer/core";
import { get as getProjection } from "ol/proj";
import { MapModel } from "@open-pioneer/map";

const FAKE_REQUEST_TIMER = 0;
const CITY_SOURCE = new FakeCitySource(FAKE_REQUEST_TIMER);
const RIVER_SOURCE = new FakeRiverSource(FAKE_REQUEST_TIMER);

afterEach(() => {
    vi.restoreAllMocks();
});

it("expect controller to return result with suggestions from one source", async () => {
    const expected = [
        {
            label: "Cities",
            source: CITY_SOURCE,
            results: [{ "id": 0, label: "Aachen" }]
        },
        {
            label: "Rivers",
            source: RIVER_SOURCE,
            results: []
        }
    ];
    const { controller } = setup([CITY_SOURCE, RIVER_SOURCE]);
    const searchResponse = await controller.search("Aachen");
    expect(searchResponse).toStrictEqual(expected);
});

it("expect controller to return no more than 'max' results", async () => {
    const expectedResults = [
        {
            "id": 0,
            "label": "Aachen"
        },
        {
            "id": 1,
            "label": "Langenfeld"
        }
    ];
    const { controller } = setup([CITY_SOURCE]);
    const searchResponse1 = await controller.search("a");
    expect(searchResponse1[0]!.results).toEqual(expectedResults);

    controller.maxResultsPerSource = 1;
    const searchResponse2 = await controller.search("a");
    expect(searchResponse2[0]!.results).toEqual([expectedResults[0]]);
});

it("expect controller to return result with suggestions from multiple sources", async () => {
    const expected = [
        {
            label: "Cities",
            source: CITY_SOURCE,
            results: [{ "id": 0, "label": "Aachen" }]
        },
        {
            label: "Rivers",
            source: RIVER_SOURCE,
            results: [
                {
                    "id": 0,
                    "label": "Maas"
                }
            ]
        }
    ];
    const { controller } = setup([CITY_SOURCE, RIVER_SOURCE]);
    const searchResponse = await controller.search("aa");
    expect(searchResponse).toStrictEqual(expected);
});

it("expect controller to filter rejected queries and return only successfully resolved ones", async () => {
    const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
    const expected = [
        {
            label: "Cities",
            source: CITY_SOURCE,
            results: [{ "id": 0, "label": "Aachen" }]
        }
    ];
    const { controller } = setup([CITY_SOURCE, new FakeRejectionSource()]);

    const searchResponse = await controller.search("aa");
    expect(searchResponse).toStrictEqual(expected);
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
            source: CITY_SOURCE,
            results: [{ "id": 0, "label": "Aachen" }]
        }
    ];
    const { controller } = setup([CITY_SOURCE]);

    let cancelled = false;
    const firstSearch = controller.search("a").catch((e) => (cancelled = !!isAbortError(e)));
    const searchResponse = await controller.search("aa");
    expect(expected).toStrictEqual(searchResponse);

    await firstSearch;
    expect(cancelled).toBe(true);
});

it("expect search source to get the maximum number of requested results in 'options'", async () => {
    let seenValues: number[] = [];
    const dummySource: SearchSource = {
        label: "Dummy Source",
        async search(_inputValue, options) {
            seenValues.push(options.maxResults);
            return [];
        }
    };

    const { controller } = setup([dummySource]);

    await controller.search("foo");
    expect(seenValues).toEqual([5]);
    seenValues = [];

    controller.maxResultsPerSource = 20;
    await controller.search("foo");
    expect(seenValues).toEqual([20]);
});

it("expect search source to get current map projection in 'options'", async () => {
    let seenProjections: string[] = [];
    const dummySource: SearchSource = {
        label: "Dummy Source",
        async search(_inputValue, options) {
            seenProjections.push(options.mapProjection.getCode());
            return [];
        }
    };

    const { controller, changeProjection } = setup([dummySource]);

    await controller.search("foo");
    expect(seenProjections).toEqual(["EPSG:4326"]);

    seenProjections = [];
    changeProjection("EPSG:3857");
    await controller.search("foo");
    expect(seenProjections).toEqual(["EPSG:3857"]);
});

function setup(sources: SearchSource[]) {
    // Map Model mock (just as needed for the controller)
    let mapProjection = getProjection("EPSG:4326");
    const mapModel = {
        get projection() {
            if (!mapProjection) {
                throw new Error("mocked map projection is null");
            }
            return mapProjection;
        }
    } satisfies Partial<MapModel> as MapModel;
    const controller = new SearchController(mapModel, sources);
    controller.searchTypingDelay = 10;

    const changeProjection = (code: string) => {
        mapProjection = getProjection(code);
    };
    return { controller, changeProjection };
}
