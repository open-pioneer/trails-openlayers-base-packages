// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OlMap from "ol/Map";
import Draw from "ol/interaction/Draw";
import { FlatStyleLike } from "ol/style/flat";
import { HttpService } from "@open-pioneer/http";
import { MapContainer, MapModel } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render } from "@testing-library/react";
import { PackageIntl } from "@open-pioneer/runtime";
import { EditingWorkflowImpl } from "./EditingWorkflowImpl";
import BaseLayer from "ol/layer/Base";
import { Interaction } from "ol/interaction";

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

describe("starting editing workflow", () => {
    it("should start an editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        expect(workflow.getState()).toBe("active:initialized");

        workflow.stop();
    });

    it("should create an editing layer for an editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        const layers: BaseLayer[] = map.olMap.getLayers().getArray();

        const editingLayer: VectorLayer<VectorSource> | undefined = layers.find(
            (l) => l.getProperties().name === "editing-layer"
        ) as VectorLayer<VectorSource>;

        if (!editingLayer) {
            throw new Error("editing layer not found");
        }
        expect(editingLayer).not.toBeUndefined;

        workflow.stop();
    });

    it("should creates a tooltip after start an editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        const beginTooltip = getTooltipElement(map.olMap, "editing-tooltip");
        if (beginTooltip instanceof Error) {
            throw beginTooltip;
        }
        expect(beginTooltip.innerHTML).toMatchInlineSnapshot('"tooltip.begin"');

        workflow.stop();
    });

    it("should add an interaction for an editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        const interactions: Interaction[] = map.olMap.getInteractions().getArray();
        const drawInteraction: Draw | undefined = interactions.find(
            (i) => i instanceof Draw
        ) as Draw;
        expect(drawInteraction).not.toBeUndefined;

        workflow.stop();
    });

    it("should does not contain a geometry after start an editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        const layers: BaseLayer[] = map.olMap.getLayers().getArray();

        const editingLayer: VectorLayer<VectorSource> | undefined = layers.find(
            (l) => l.getProperties().name === "editing-layer"
        ) as VectorLayer<VectorSource>;
        if (!editingLayer) {
            throw new Error("editing layer not found");
        }

        const editingSource = editingLayer.getSource();
        if (!editingSource) {
            throw new Error("editing source not found");
        }
        expect(editingSource.getFeatures().length).toBe(0);

        workflow.stop();
    });

    it("should start editing workflow after stop", async () => {
        const { map } = await renderMap();

        const workflow = (await setupWorkflow(map)).workflow;
        expect(workflow.getState()).toBe("active:initialized");

        workflow.stop();
        expect(workflow.getState()).toBe("inactive");

        const nextWorkflow = (await setupWorkflow(map)).workflow;
        expect(nextWorkflow.getState()).toBe("active:initialized");

        nextWorkflow.stop();
    });
});

describe("stopping editing workflow", () => {
    it("should stop an editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        expect(workflow.getState()).toBe("active:initialized");

        workflow.stop();
        expect(workflow.getState()).toBe("inactive");
    });

    it("should remove an editing layer for an editing workflow after stop", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        workflow.stop();
        const layers: BaseLayer[] = map.olMap.getLayers().getArray();

        const editingLayer: VectorLayer<VectorSource> | undefined = layers.find(
            (l) => l.getProperties().name === "editing-layer"
        ) as VectorLayer<VectorSource>;
        expect(editingLayer).toBeUndefined;
    });

    it("should remove a tooltip after stop an editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        workflow.stop();

        const beginTooltip = getTooltipElement(map.olMap, "editing-tooltip");
        expect(beginTooltip instanceof Error).toBe(true);
    });

    it("should remove an interaction for an editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        workflow.stop();

        const interactions: Interaction[] = map.olMap.getInteractions().getArray();
        const drawInteraction: Draw | undefined = interactions.find(
            (i) => i instanceof Draw
        ) as Draw;
        expect(drawInteraction).toBeUndefined;
    });
});

describe("during editing workflow", () => {
    it("should change state after starting editing", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        const draw = workflow.getDrawInteraction();

        draw.appendCoordinates([[200, 200]]);
        expect(workflow.getState()).toBe("active:drawing");

        workflow.stop();
    });

    it("should change state after finished editing", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        const draw = workflow.getDrawInteraction();

        draw.appendCoordinates([[200, 200]]);
        draw.finishDrawing();
        expect(workflow.getState()).toBe("active:saving");
    });

    it("should updates the tooltip text after starting editing", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        const draw = workflow.getDrawInteraction();

        draw.appendCoordinates([[200, 200]]);
        const beginTooltip = getTooltipElement(map.olMap, "editing-tooltip");
        if (beginTooltip instanceof Error) {
            throw beginTooltip;
        }
        expect(beginTooltip.innerHTML).toMatchInlineSnapshot('"tooltip.continue"');

        workflow.stop();
    });

    it("should contain a geometry after starting editing ", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        const layers: BaseLayer[] = map.olMap.getLayers().getArray();
        const draw = workflow.getDrawInteraction();

        const editingLayer: VectorLayer<VectorSource> | undefined = layers.find(
            (l) => l.getProperties().name === "editing-layer"
        ) as VectorLayer<VectorSource>;

        if (!editingLayer) {
            throw new Error("editing layer not found");
        }

        const editingSource = editingLayer.getSource();
        if (!editingSource) {
            throw new Error("editing source not found");
        }

        draw.appendCoordinates([[200, 200]]);
        draw.appendCoordinates([[400, 300]]);

        const feature = draw.getOverlay().getSource().getFeatures()[0];
        if (!feature) {
            throw new Error("no features founded");
        }
        expect(feature.getGeometry().getCoordinates()).toStrictEqual([
            [
                [200, 200],
                [400, 300],
                [400, 300],
                [200, 200]
            ]
        ]);

        workflow.stop();
    });
});

describe("reset editing workflow", () => {
    it("should change state after reset editing", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        const draw = workflow.getDrawInteraction();
        expect(workflow.getState()).toBe("active:initialized");

        draw.appendCoordinates([[200, 200]]);
        expect(workflow.getState()).toBe("active:drawing");

        workflow.reset();
        expect(workflow.getState()).toBe("active:initialized");

        workflow.stop();
    });

    it("should updates the tooltip text after reset editing", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        const draw = workflow.getDrawInteraction();

        draw.appendCoordinates([[200, 200]]);
        const beginTooltip = getTooltipElement(map.olMap, "editing-tooltip");
        if (beginTooltip instanceof Error) {
            throw beginTooltip;
        }
        expect(beginTooltip.innerHTML).toMatchInlineSnapshot('"tooltip.continue"');

        workflow.reset();
        const resetTooltip = getTooltipElement(map.olMap, "editing-tooltip");
        if (resetTooltip instanceof Error) {
            throw resetTooltip;
        }
        expect(resetTooltip.innerHTML).toMatchInlineSnapshot('"tooltip.begin"');

        workflow.stop();
    });

    it("should does not remove interaction after reset editing", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        workflow.reset();

        const interactions: Interaction[] = map.olMap.getInteractions().getArray();
        const drawInteraction: Draw | undefined = interactions.find(
            (i) => i instanceof Draw
        ) as Draw;
        expect(drawInteraction).not.toBeUndefined;

        workflow.stop();
    });

    it("should does not contain a geometry after reset editing", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        const draw = workflow.getDrawInteraction();

        draw.appendCoordinates([[200, 200]]);
        draw.appendCoordinates([[400, 300]]);

        workflow.reset();

        const features = draw.getOverlay().getSource().getFeatures();
        expect(features.length).toBe(0);

        workflow.stop();
    });
});

describe("when editing workflow complete", () => {
    it("should return a feature id when complete editing", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        const draw = workflow.getDrawInteraction();

        workflow.whenComplete().then((featureId: string | undefined) => {
            expect(featureId).toBe("test_id_1");
        });

        draw.appendCoordinates([[200, 200]]);
        draw.appendCoordinates([[400, 300]]);

        draw.finishDrawing();
    });

    it("should return `undefined` if editing is stop while draw geometry", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map);
        const draw = workflow.getDrawInteraction();

        workflow.whenComplete().then((featureId: string | undefined) => {
            expect(featureId).toBeUndefined;
        });

        draw.appendCoordinates([[200, 200]]);
        draw.appendCoordinates([[400, 300]]);

        workflow.stop();
    });

    it("should return an error if editing failed", async () => {
        const httpService: HttpService = {
            fetch: vi.fn().mockResolvedValue(
                new Response("", {
                    status: 401 // HTTP Unauthorized
                })
            )
        } satisfies Partial<HttpService> as HttpService;

        const { map } = await renderMap();
        const { workflow } = await setupWorkflow(map, httpService);
        const draw = workflow.getDrawInteraction();

        workflow
            .whenComplete()
            .then(() => {})
            .catch((error: Error) => {
                expect(error.message).toBe("Request failed: 401");
            });

        draw.appendCoordinates([[200, 200]]);
        draw.appendCoordinates([[400, 300]]);

        draw.finishDrawing();
    });
});

async function renderMap() {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="map" />
        </PackageContextProvider>
    );

    await waitForMapMount("map");

    const map = await registry.expectMapModel(mapId);

    return { mapId, map };
}

async function setupWorkflow(map: MapModel, httpService: HttpService = HTTP_SERVICE) {
    const intl = {
        formatMessage(props: any) {
            return props.id;
        }
    } satisfies Partial<PackageIntl> as PackageIntl;

    const polygonDrawStyle: FlatStyleLike = {
        "stroke-color": "yellow",
        "stroke-width": 2,
        "fill-color": "rgba(0, 0, 0, 0.1)",
        "circle-radius": 5,
        "circle-fill-color": "rgba(0, 0, 255, 0.2)",
        "circle-stroke-color": "rgba(0, 0, 255, 0.7)",
        "circle-stroke-width": 2
    };

    const workflow = new EditingWorkflowImpl({
        map,
        ogcApiFeatureLayerUrl: OGC_API_URL_TEST,
        polygonDrawStyle: polygonDrawStyle as FlatStyleLike,
        httpService,
        intl
    });

    return { map, workflow };
}

function getTooltipElement(olMap: OlMap, className: string): HTMLElement | Error {
    const allOverlays = olMap.getOverlays().getArray();
    const tooltips = allOverlays.filter((ol) => ol.getElement()?.classList.contains(className));
    if (tooltips.length === 0) {
        return new Error("did not find any tooltips");
    }
    if (tooltips.length > 1) {
        return new Error("found multiple tooltips");
    }

    const element = tooltips[0]!.getElement();
    if (!element) {
        return new Error("tooltip overlay did not have an element");
    }

    return element;
}
