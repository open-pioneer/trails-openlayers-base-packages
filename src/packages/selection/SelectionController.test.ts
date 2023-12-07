// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, vi, it, describe } from "vitest";
import { SelectionController } from "./SelectionController";
import { SelectionSource } from "./api";
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
        "unavailable",
        ALL_EXPECTED_FEATURES
    );
    const ALL_POINTS_FOUND_RESPONSE = [
        {
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
        }
    ];

    it("expect controller to return results from one source", async () => {
        const expected = ALL_POINTS_FOUND_RESPONSE;
        const { controller } = setup([POINT_SOURCE]);
        const selectionResponse = await controller.select(FULL_EXTENT);
        expect(selectionResponse).toStrictEqual(expected);
    });

    it("expect controller to return no more than 'max' results", async () => {
        const { controller } = setup([POINT_SOURCE]);
        const getExpectedResult = (
            allPointsFoundResponse: typeof ALL_POINTS_FOUND_RESPONSE,
            maxResults: number
        ) =>
            allPointsFoundResponse.map((response) => {
                response.results = response.results.slice(0, maxResults);
                return response;
            });
        const expected1 = getExpectedResult(ALL_POINTS_FOUND_RESPONSE, 1);
        controller.maxResultsPerSource = 1;
        const selectResponse1 = await controller.select(FULL_EXTENT);
        expect(selectResponse1).toEqual(expected1);

        const expected2 = getExpectedResult(ALL_POINTS_FOUND_RESPONSE, 0);
        controller.maxResultsPerSource = 0;
        const selectResponse2 = await controller.select(FULL_EXTENT);
        expect(selectResponse2).toEqual(expected2);
    });

    it.skip("expect controller to filter rejected queries and return only successfully resolved ones", async () => {
        const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
        const dummyRejectionSource: SelectionSource = {
            label: "Rejected",
            async select(extent, options) {
                return Promise.reject(new Error(`select with ${extent} rejected`));
            }
        };

        const { controller } = setup([POINT_SOURCE, dummyRejectionSource]);

        const selectResponse = await controller.select(FULL_EXTENT);
        expect(selectResponse).toStrictEqual(ALL_POINTS_FOUND_RESPONSE);
        /*expect(logSpy).toMatchInlineSnapshot('[MockFunction error]');*/
        /*expect(selectResponse).toStrictEqual(ALL_POINTS_FOUND_RESPONSE);*/
    });

    it("expect select source to get current map projection in 'options'", async () => {
        let seenProjections: string[] = [];
        const dummySource: SelectionSource = {
            label: "Dummy Source",
            async select(extent, options) {
                seenProjections.push(options.mapProjection.getCode());
                return [];
            }
        };

        const { controller, changeProjection } = setup([dummySource]);

        const dummyExtent = [Infinity, Infinity, Infinity, Infinity];
        await controller.select(dummyExtent);
        expect(seenProjections).toEqual(["EPSG:4326"]);

        seenProjections = [];
        changeProjection("EPSG:3857");
        await controller.select(dummyExtent);
        expect(seenProjections).toEqual(["EPSG:3857"]);
    });
});

function setup(sources: SelectionSource[]) {
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
    const controller = new SelectionController(mapModel, sources);
    const changeProjection = (code: string) => {
        mapProjection = getProjection(code);
    };
    return { controller, changeProjection };
}
