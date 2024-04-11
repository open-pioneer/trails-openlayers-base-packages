// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import { EditingServiceImpl } from "./EditingServiceImpl";
import { setupMap } from "@open-pioneer/map-test-utils";
import { HttpService } from "@open-pioneer/http";
import { createService } from "@open-pioneer/test-utils/services";
import { FlatStyle } from "ol/style/flat";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { EditingCreateWorkflowImpl } from "./EditingCreateWorkflowImpl";
import { EditingUpdateWorkflowImpl } from "./EditingUpdateWorkflowImpl";

const OGC_API_URL_TEST = new URL("https://example.org/ogc");

const TEST_ID = "test_id";

const DEFAULT_FEATURE = new Feature({ geometry: new Point([0, 0]) });
DEFAULT_FEATURE.setId(TEST_ID);

const HTTP_SERVICE: HttpService = {
    fetch: vi.fn().mockResolvedValue(
        new Response("", {
            headers: {
                Location: `${OGC_API_URL_TEST}/${TEST_ID}`
            },
            status: 201
        })
    )
} satisfies Partial<HttpService> as HttpService;

const POLYGON_DRAW_STYLE: FlatStyle = {
    "stroke-color": "yellow",
    "stroke-width": 2,
    "fill-color": "rgba(0, 0, 0, 0.1)",
    "circle-radius": 5,
    "circle-fill-color": "rgba(0, 0, 255, 0.2)",
    "circle-stroke-color": "rgba(0, 0, 255, 0.7)",
    "circle-stroke-width": 2
};

describe("editing: create", () => {
    describe("tests for starting an editing", () => {
        it("should start an editing", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            const workflow = editingService.createFeature(map, OGC_API_URL_TEST);
            expect(workflow instanceof EditingCreateWorkflowImpl).toBe(true);
        });

        it("should throw an error if editing is started twice for the same map id", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.createFeature(map, OGC_API_URL_TEST);

            expect(() => editingService.createFeature(map, OGC_API_URL_TEST)).toThrowError(
                "EditingWorkflow could not be started. EditingWorkflow already in progress for this map."
            );
        });
    });

    describe("tests for stopping an editing", () => {
        it("should stop an editing", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.createFeature(map, OGC_API_URL_TEST);

            const stop = editingService.stop(mapId);
            expect(stop).toBeUndefined;
        });

        it("should return no error if editing is stopped twice for a given map id", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.createFeature(map, OGC_API_URL_TEST);

            editingService.stop(mapId);
            const stop = editingService.stop(mapId);
            expect(stop).toBeUndefined;
        });

        it("should return an error if editing is stopped for a non existing map id", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.createFeature(map, OGC_API_URL_TEST);

            const stop = editingService.stop("mapId");
            expect(stop instanceof Error).toBe(true);
            expect(stop?.message).toBe("No workflow found for mapId: mapId");
        });
    });

    describe("tests for resetting an editing", () => {
        it("should successfully trigger resetting an editing drawing", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.createFeature(map, OGC_API_URL_TEST);

            const reset = editingService.reset(mapId);
            expect(reset).toBeUndefined;
        });

        it("should return no error if editing is reset twice for a given map id", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.createFeature(map, OGC_API_URL_TEST);

            editingService.reset(mapId);
            const reset = editingService.reset(mapId);
            expect(reset).toBeUndefined;
        });

        it("should return an error if editing is reset for a non existing map id", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.createFeature(map, OGC_API_URL_TEST);

            const reset = editingService.reset("mapId");
            expect(reset instanceof Error).toBe(true);
            expect(reset?.message).toBe("No workflow found for mapId: mapId");
        });
    });
});

describe("editing: update", () => {
    describe("tests for starting an editing", () => {
        it("should start an editing", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            const workflow = editingService.updateFeature(map, OGC_API_URL_TEST, DEFAULT_FEATURE);
            expect(workflow instanceof EditingUpdateWorkflowImpl).toBe(true);
        });

        it("should throw an error if editing is started twice for the same map id", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.updateFeature(map, OGC_API_URL_TEST, DEFAULT_FEATURE);

            expect(() =>
                editingService.updateFeature(map, OGC_API_URL_TEST, DEFAULT_FEATURE)
            ).toThrowError(
                "EditingWorkflow could not be started. EditingWorkflow already in progress for this map."
            );
        });
    });

    describe("tests for stopping an editing", () => {
        it("should stop an editing", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.updateFeature(map, OGC_API_URL_TEST, DEFAULT_FEATURE);

            const stop = editingService.stop(mapId);
            expect(stop).toBeUndefined;
        });

        it("should return no error if editing is stopped twice for a given map id", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.updateFeature(map, OGC_API_URL_TEST, DEFAULT_FEATURE);

            editingService.stop(mapId);
            const stop = editingService.stop(mapId);
            expect(stop).toBeUndefined;
        });

        it("should return an error if editing is stopped for a non existing map id", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.updateFeature(map, OGC_API_URL_TEST, DEFAULT_FEATURE);

            const stop = editingService.stop("mapId");
            expect(stop instanceof Error).toBe(true);
            expect(stop?.message).toBe("No workflow found for mapId: mapId");
        });
    });

    describe("tests for resetting an editing", () => {
        it("should successfully trigger resetting an editing drawing", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.updateFeature(map, OGC_API_URL_TEST, DEFAULT_FEATURE);

            const reset = editingService.reset(mapId);
            expect(reset).toBeUndefined;
        });

        it("should return no error if editing is reset twice for a given map id", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.updateFeature(map, OGC_API_URL_TEST, DEFAULT_FEATURE);

            editingService.reset(mapId);
            const reset = editingService.reset(mapId);
            expect(reset).toBeUndefined;
        });

        it("should return an error if editing is reset for a non existing map id", async () => {
            const { mapId, registry } = await setupMap();
            const map = await registry.expectMapModel(mapId);

            const editingService = await createService(EditingServiceImpl, {
                references: {
                    mapRegistry: registry,
                    httpService: HTTP_SERVICE
                },
                properties: {
                    POLYGON_DRAW_STYLE
                }
            });

            editingService.updateFeature(map, OGC_API_URL_TEST, DEFAULT_FEATURE);

            const reset = editingService.reset("mapId");
            expect(reset instanceof Error).toBe(true);
            expect(reset?.message).toBe("No workflow found for mapId: mapId");
        });
    });
});
