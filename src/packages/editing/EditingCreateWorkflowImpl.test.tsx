// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import VectorLayer from "ol/layer/Vector";
import OlMap from "ol/Map";
import Draw from "ol/interaction/Draw";
import { FlatStyle } from "ol/style/flat";
import { HttpService } from "@open-pioneer/http";
import { MapContainer, MapModel } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render } from "@testing-library/react";
import { PackageIntl } from "@open-pioneer/runtime";
import { EditingCreateWorkflowImpl } from "./EditingCreateWorkflowImpl";
import BaseLayer from "ol/layer/Base";
import { Interaction } from "ol/interaction";
import { Feature } from "ol";

const OGC_API_URL_TEST = new URL("https://example.org/ogc");
const DEFAULT_SLEEP = 50;
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

describe("starting create editing workflow", () => {
    it("should start a create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        expect(workflow.getState()).toBe("active:initialized");

        workflow.stop();
    });

    it("should create an editing layer for a create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        const layers: BaseLayer[] = map.olMap.getLayers().getArray();

        const editingLayer = layers.find((l) => l.getProperties().name === "editing-layer") as
            | VectorLayer<Feature>
            | undefined;

        if (!editingLayer) {
            throw new Error("editing layer not found");
        }
        expect(editingLayer).not.toBeUndefined();

        workflow.stop();
    });

    it("should creates a tooltip after start a create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        const beginTooltip = getTooltipElement(map.olMap, "editing-tooltip");
        if (beginTooltip instanceof Error) {
            throw beginTooltip;
        }
        expect(beginTooltip.innerHTML).toMatchInlineSnapshot(`"<span>create.tooltip.begin</span>"`);

        workflow.stop();
    });

    it("should add an interaction for a create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        const interactions: Interaction[] = map.olMap.getInteractions().getArray();
        const drawInteraction: Draw | undefined = interactions.find(
            (i) => i instanceof Draw
        ) as Draw;
        expect(drawInteraction).not.toBeUndefined();

        workflow.stop();
    });

    it("should does not contain a geometry after start a create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);

        const editingLayer = findEditingLayer(map);
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

    it("should start a create editing workflow after stop", async () => {
        const { map } = await renderMap();

        const workflow = (await setupCreateWorkflow(map)).workflow;
        expect(workflow.getState()).toBe("active:initialized");

        workflow.stop();
        expect(workflow.getState()).toBe("destroyed");

        const nextWorkflow = (await setupCreateWorkflow(map)).workflow;
        expect(nextWorkflow.getState()).toBe("active:initialized");

        nextWorkflow.stop();
    });
});

describe("stopping create editing workflow", () => {
    it("should stop a create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        expect(workflow.getState()).toBe("active:initialized");

        workflow.stop();
        expect(workflow.getState()).toBe("destroyed");
    });

    it("should remove an editing layer for a create editing workflow after stop", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        workflow.stop();

        const editingLayer = findEditingLayer(map);
        expect(editingLayer).toBeUndefined();
    });

    it("should remove a tooltip after stop a create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        workflow.stop();

        const beginTooltip = getTooltipElement(map.olMap, "editing-tooltip");
        expect(beginTooltip instanceof Error).toBe(true);
    });

    it("should remove an interaction for a create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        workflow.stop();

        const interactions: Interaction[] = map.olMap.getInteractions().getArray();
        const drawInteraction: Draw | undefined = interactions.find(
            (i) => i instanceof Draw
        ) as Draw;
        expect(drawInteraction).toBeUndefined();
    });
});

describe("during create editing workflow", () => {
    it("should change state after starting create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        const draw = workflow.getDrawInteraction();

        draw.appendCoordinates([[200, 200]]);
        expect(workflow.getState()).toBe("active:drawing");

        workflow.stop();
    });

    it("should change state after finished create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        const draw = workflow.getDrawInteraction();

        draw.appendCoordinates([[200, 200]]);
        workflow.triggerSave();
        expect(workflow.getState()).toBe("active:saving");
    });

    it("should updates the tooltip text after starting create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        const draw = workflow.getDrawInteraction();

        draw.appendCoordinates([[200, 200]]);
        const beginTooltip = getTooltipElement(map.olMap, "editing-tooltip");
        if (beginTooltip instanceof Error) {
            throw beginTooltip;
        }
        expect(beginTooltip.innerHTML).toMatchInlineSnapshot(
            `"<span>create.tooltip.continue</span>"`
        );

        workflow.stop();
    });

    it("should contain a geometry after starting create editing workflow ", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        const draw = workflow.getDrawInteraction();

        const editingLayer = findEditingLayer(map);
        if (!editingLayer) {
            throw new Error("editing layer not found");
        }

        const editingSource = editingLayer.getSource();
        if (!editingSource) {
            throw new Error("editing source not found");
        }

        draw.appendCoordinates([[200, 200]]);
        draw.appendCoordinates([[400, 300]]);

        const feature = draw.getOverlay().getSource()!.getFeatures()[0];
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

describe("reset create editing workflow", () => {
    it("should change state after reset create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        const draw = workflow.getDrawInteraction();
        expect(workflow.getState()).toBe("active:initialized");

        draw.appendCoordinates([[200, 200]]);
        expect(workflow.getState()).toBe("active:drawing");

        workflow.reset();
        expect(workflow.getState()).toBe("active:initialized");

        workflow.stop();
    });

    it("should updates the tooltip text after reset create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        const draw = workflow.getDrawInteraction();

        draw.appendCoordinates([[200, 200]]);
        const beginTooltip = getTooltipElement(map.olMap, "editing-tooltip");
        if (beginTooltip instanceof Error) {
            throw beginTooltip;
        }
        expect(beginTooltip.innerHTML).toMatchInlineSnapshot(
            `"<span>create.tooltip.continue</span>"`
        );

        workflow.reset();
        const resetTooltip = getTooltipElement(map.olMap, "editing-tooltip");
        if (resetTooltip instanceof Error) {
            throw resetTooltip;
        }
        expect(resetTooltip.innerHTML).toMatchInlineSnapshot(`"<span>create.tooltip.begin</span>"`);

        workflow.stop();
    });

    it("should does not remove interaction after reset create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        workflow.reset();

        const interactions: Interaction[] = map.olMap.getInteractions().getArray();
        const drawInteraction: Draw | undefined = interactions.find(
            (i) => i instanceof Draw
        ) as Draw;
        expect(drawInteraction).not.toBeUndefined();

        workflow.stop();
    });

    it("should does not contain a geometry after reset create editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        const draw = workflow.getDrawInteraction();

        draw.appendCoordinates([[200, 200]]);
        draw.appendCoordinates([[400, 300]]);

        workflow.reset();

        const features = draw.getOverlay().getSource()!.getFeatures();
        expect(features.length).toBe(0);

        workflow.stop();
    });
});

describe("when create editing workflow complete", () => {
    it("should return a feature id when create editing workflow is complete", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        const draw = workflow.getDrawInteraction();

        draw.appendCoordinates([[200, 200]]);
        draw.appendCoordinates([[400, 300]]);

        workflow.triggerSave();

        await sleep(DEFAULT_SLEEP);

        const featureData = await workflow.whenComplete();
        expect(featureData?.featureId).toBe("test_id_1");
    });

    it("should return `undefined` if create editing workflow is stopped while draw geometry", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map);
        const draw = workflow.getDrawInteraction();

        draw.appendCoordinates([[200, 200]]);
        draw.appendCoordinates([[400, 300]]);

        workflow.stop();

        await sleep(DEFAULT_SLEEP);

        const featureData = await workflow.whenComplete();
        expect(featureData?.featureId).toBeUndefined();
    });

    it("should return an error if create editing workflow failed", async () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);

        const httpService: HttpService = {
            fetch: vi.fn().mockResolvedValue(
                new Response("", {
                    status: 401 // HTTP Unauthorized
                })
            )
        } satisfies Partial<HttpService> as HttpService;

        const { map } = await renderMap();
        const { workflow } = await setupCreateWorkflow(map, httpService);
        const draw = workflow.getDrawInteraction();

        draw.appendCoordinates([[200, 200]]);
        draw.appendCoordinates([[400, 300]]);

        workflow.triggerSave();

        await sleep(DEFAULT_SLEEP);
        await expect(workflow.whenComplete()).rejects.toThrowErrorMatchingInlineSnapshot(
            `[Error: Failed to save feature]`
        );
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

async function setupCreateWorkflow(map: MapModel, httpService: HttpService = HTTP_SERVICE) {
    const intl = {
        formatMessage(props: any) {
            return props.id;
        }
    } satisfies Partial<PackageIntl> as PackageIntl;

    const polygonStyle: FlatStyle = {
        "fill-color": "rgba(255,255,255,0.4)",
        "stroke-color": "red",
        "stroke-width": 2,
        "circle-radius": 5,
        "circle-fill-color": "red",
        "circle-stroke-width": 1.25,
        "circle-stroke-color": "red"
    };
    const vertexStyle: FlatStyle = {
        "circle-radius": 5,
        "circle-fill-color": "red",
        "circle-stroke-width": 1.25,
        "circle-stroke-color": "red"
    };

    const workflow = new EditingCreateWorkflowImpl({
        map,
        ogcApiFeatureLayerUrl: OGC_API_URL_TEST,
        polygonStyle,
        vertexStyle,
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

function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}

function findEditingLayer(map: MapModel) {
    const layers = map.olMap.getLayers().getArray();
    const editingLayer = layers.find((l) => l.getProperties().name === "editing-layer") as
        | VectorLayer<Feature>
        | undefined;
    return editingLayer;
}
