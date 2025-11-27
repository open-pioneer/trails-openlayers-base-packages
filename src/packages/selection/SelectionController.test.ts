// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, vi, it, describe } from "vitest";
import { SelectionController } from "./SelectionController";
import { SelectionOptions, SelectionSource } from "./api";
import { FakePointSelectionSource } from "./test-utils";
import { get as getProjection } from "ol/proj";
import { Point } from "ol/geom";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("point selection source", () => {
    const FAKE_REQUEST_TIMER = 0;
    const ALL_EXPECTED_FEATURES = [
        new Point([407354, 5754673]), // con terra (Bottom Right)
        new Point([404740, 5757893]) // Schloss (Top Left)
    ];
    const FULL_EXTENT = [404740, 5754673, 407354, 5757893]; // [minx, miny, maxx, maxy]
    const EXTENT_ONLY_CON_TERRA = [407000, 5754000, 408000, 5755000];
    const POINT_SOURCE = new FakePointSelectionSource(
        FAKE_REQUEST_TIMER,
        "available",
        ALL_EXPECTED_FEATURES
    );
    const ALL_POINTS_FOUND_RESPONSE = {
        source: POINT_SOURCE,
        results: [
            {
                id: 0,
                geometry: ALL_EXPECTED_FEATURES[0]
            },
            {
                id: 1,
                geometry: ALL_EXPECTED_FEATURES[1]
            }
        ]
    };

    it("expect controller to return results from one source", async () => {
        const expected = ALL_POINTS_FOUND_RESPONSE;

        const { controller } = setup();
        const selectionResponse = await controller.select(POINT_SOURCE, FULL_EXTENT);
        expect(selectionResponse).toStrictEqual(expected);
    });

    it("expect controller to return subset of results from one source", async () => {
        const expected = {
            ...ALL_POINTS_FOUND_RESPONSE,
            results: ALL_POINTS_FOUND_RESPONSE.results.slice(0, 1)
        };

        const { controller } = setup();
        const selectionResponse = await controller.select(POINT_SOURCE, EXTENT_ONLY_CON_TERRA);
        expect(selectionResponse).toStrictEqual(expected);
    });

    it("expect controller logs an error and uses callback if the source throws an error", async () => {
        const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
        const dummyRejectionSource: SelectionSource = {
            label: "Rejected",
            async select(extent) {
                throw new Error(`select with ${JSON.stringify(extent)} rejected`);
            }
        };

        const onError = vi.fn();
        const { controller } = setup(undefined, onError);

        const selectResponse = await controller.select(dummyRejectionSource, FULL_EXTENT);
        expect(selectResponse).toBeUndefined();
        expect(onError).toHaveBeenCalledOnce();
        expect(logSpy.mock.calls).toMatchInlineSnapshot(`
          [
            [
              "[ERROR] selection:SelectionController: selection from source Rejected failed",
              [Error: select with {"type":"extent","extent":[404740,5754673,407354,5757893]} rejected],
            ],
          ]
        `);
    });

    it("expect controller to return no more than 'max' results", async () => {
        const getExpectedResult = (
            allPointsFoundResponse: typeof ALL_POINTS_FOUND_RESPONSE,
            maxResults: number
        ) => {
            return {
                ...allPointsFoundResponse,
                results: allPointsFoundResponse.results.slice(0, maxResults)
            };
        };
        const { controller: controller1 } = setup(1);
        const expected1 = getExpectedResult(ALL_POINTS_FOUND_RESPONSE, 1);
        const selectResponse1 = await controller1.select(POINT_SOURCE, FULL_EXTENT);
        expect(selectResponse1).toEqual(expected1);

        const { controller: controller0 } = setup(0);
        const expected2 = getExpectedResult(ALL_POINTS_FOUND_RESPONSE, 0);
        const selectResponse2 = await controller0.select(POINT_SOURCE, FULL_EXTENT);
        expect(selectResponse2).toEqual(expected2);
    });

    it("expect select source to get expected parameters in 'options'", async () => {
        let seenOptions: SelectionOptions[] = [];
        const dummySource: SelectionSource = {
            label: "Dummy Source",

            async select(_, options) {
                seenOptions.push(options);
                return [];
            }
        };

        const { controller, changeProjection } = setup();
        const dummyExtent = [Infinity, Infinity, Infinity, Infinity];
        await controller.select(dummySource, dummyExtent);
        const options = seenOptions[0]!;
        expect(options).toBeDefined();
        expect(options.mapProjection.getCode()).toBe("EPSG:4326");
        expect(options.signal).toBeInstanceOf(AbortSignal);
        expect(options.maxResults).toBe(10000); // Default value

        seenOptions = [];
        changeProjection("EPSG:3857");
        await controller.select(dummySource, dummyExtent);
        expect(seenOptions[0]?.mapProjection.getCode()).toBe("EPSG:3857");
    });
});

function setup(maxResults?: number, onError?: () => void) {
    // Map Model mock (just as needed for the controller)
    let mapProjection = getProjection("EPSG:4326");
    const mapModel: any = {
        olMap: {
            getView() {
                return {
                    getProjection() {
                        return mapProjection;
                    }
                };
            }
        }
    };
    onError = onError ?? function () {};
    const controller = new SelectionController({
        mapModel,
        onError,
        maxResults
    });
    const changeProjection = (code: string) => {
        mapProjection = getProjection(code);
    };
    return { controller, changeProjection };
}
