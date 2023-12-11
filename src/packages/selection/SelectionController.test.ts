// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, vi, it, describe } from "vitest";
import { SelectionController } from "./SelectionController";
import { SelectionOptions, SelectionSource } from "./api";
import { FakePointSelectionSource } from "./testSources";
import { get as getProjection } from "ol/proj";
import { Point } from "ol/geom";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("point selection source", () => {
    const FAKE_REQUEST_TIMER = 0;
    const ALL_EXPECTED_FEATURES = [new Point([852011, 6788511]), new Point([829800, 6809086])];
    const FULL_EXTENT = [829800, 852011, 6788511, 6809086];
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

        const { controller } = setup([POINT_SOURCE]);
        const selectionResponse = await controller.select(POINT_SOURCE, FULL_EXTENT);
        expect(selectionResponse).toStrictEqual(expected);
    });

    it("expect controller logs an error if the source throws an error", async () => {
        const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
        const dummyRejectionSource: SelectionSource = {
            label: "Rejected",
            async select(extent) {
                throw new Error(`select with ${JSON.stringify(extent)} rejected`);
            }
        };

        const { controller } = setup([POINT_SOURCE, dummyRejectionSource]);

        const selectResponse = await controller.select(dummyRejectionSource, FULL_EXTENT);
        expect(selectResponse).toBeUndefined();
        expect(logSpy.mock.calls).toMatchInlineSnapshot(`
          [
            [
              "[ERROR] selection:SelectionController: selection from source Rejected failed",
              [Error: select with {"type":"extent","extent":[829800,852011,6788511,6809086]} rejected],
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
        const { controller: controller1 } = setup([POINT_SOURCE], 1);
        const expected1 = getExpectedResult(ALL_POINTS_FOUND_RESPONSE, 1);
        const selectResponse1 = await controller1.select(POINT_SOURCE, FULL_EXTENT);
        expect(selectResponse1).toEqual(expected1);

        const { controller: controller0 } = setup([POINT_SOURCE], 0);
        const expected2 = getExpectedResult(ALL_POINTS_FOUND_RESPONSE, 0);
        const selectResponse2 = await controller0.select(POINT_SOURCE, FULL_EXTENT);
        expect(selectResponse2).toEqual(expected2);
    });

    it("expect select source to get expected parameters in 'options'", async () => {
        let seenOptions: SelectionOptions[] = [];
        const dummySource: SelectionSource = {
            label: "Dummy Source",

            async select(extent, options) {
                seenOptions.push(options);
                return [];
            }
        };

        const { controller, changeProjection } = setup([dummySource]);
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

function setup(sources: SelectionSource[], maxResults?: number) {
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
    const controller = new SelectionController({
        mapModel,
        sources,
        onError() {
            /* TODO */
        },
        maxResults
    });
    const changeProjection = (code: string) => {
        mapProjection = getProjection(code);
    };
    return { controller, changeProjection };
}
