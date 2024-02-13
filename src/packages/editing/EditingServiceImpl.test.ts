// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import { EditingServiceImpl } from "./EditingServiceImpl";
import { setupMap } from "@open-pioneer/map-test-utils";
import { HttpService } from "@open-pioneer/http";
import { createService } from "@open-pioneer/test-utils/services";
import { FlatStyleLike } from "ol/style/flat";
import { EditingWorkflow } from "./EditingWorkflow";

const OGC_API_URL_TEST = new URL("https://example.org/ogc");

const HTTP_SERVICE: HttpService = {
    fetch: vi.fn().mockResolvedValue(
        new Response("", {
            headers: {
                Location: OGC_API_URL_TEST + "/test_id_1"
            },
            status: 201
        })
    )
} satisfies Partial<HttpService> as HttpService;

const POLYGON_DRAW_STYLE: FlatStyleLike = {
    "stroke-color": "yellow",
    "stroke-width": 2,
    "fill-color": "rgba(0, 0, 0, 0.1)",
    "circle-radius": 5,
    "circle-fill-color": "rgba(0, 0, 255, 0.2)",
    "circle-stroke-color": "rgba(0, 0, 255, 0.7)",
    "circle-stroke-width": 2
};

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

        const workflow = editingService.start(map, OGC_API_URL_TEST);
        expect(workflow instanceof EditingWorkflow).toBe(true);
    });

    it("should throw an error if start editing twice for the same map id", async () => {
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

        editingService.start(map, OGC_API_URL_TEST);

        expect(() => editingService.start(map, OGC_API_URL_TEST)).toThrowError(
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

        editingService.start(map, OGC_API_URL_TEST);

        const stop = editingService.stop(mapId);
        expect(stop).toBeUndefined;
    });

    it("should return no error if editing will be stop twice for a given map id", async () => {
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

        editingService.start(map, OGC_API_URL_TEST);

        editingService.stop(mapId);
        const stop = editingService.stop(mapId);
        expect(stop).toBeUndefined;
    });

    it("should return an error if editing will be stop for a not existing map id", async () => {
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

        editingService.start(map, OGC_API_URL_TEST);

        const stop = editingService.stop("mapId");
        expect(stop instanceof Error).toBe(true);
        expect(stop?.message).toBe("No workflow found for mapId: mapId");
    });
});

describe("tests for resting an editing", () => {
    it("should reset an editing", async () => {
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

        editingService.start(map, OGC_API_URL_TEST);

        const reset = editingService.reset(mapId);
        expect(reset).toBeUndefined;
    });

    it("should return no error if editing will be reset twice for a given map id", async () => {
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

        editingService.start(map, OGC_API_URL_TEST);

        editingService.reset(mapId);
        const reset = editingService.reset(mapId);
        expect(reset).toBeUndefined;
    });

    it("should return an error if editing will be reset for a not existing map id", async () => {
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

        editingService.start(map, OGC_API_URL_TEST);

        const reset = editingService.reset("mapId");
        expect(reset instanceof Error).toBe(true);
        expect(reset?.message).toBe("No workflow found for mapId: mapId");
    });
});
