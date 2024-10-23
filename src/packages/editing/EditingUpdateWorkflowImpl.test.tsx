// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import VectorLayer from "ol/layer/Vector";
import { FlatStyle } from "ol/style/flat";
import { HttpService } from "@open-pioneer/http";
import { MapContainer, MapModel } from "@open-pioneer/map";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render } from "@testing-library/react";
import { PackageIntl } from "@open-pioneer/runtime";
import { EditingUpdateWorkflowImpl } from "./EditingUpdateWorkflowImpl";
import { Interaction, Modify } from "ol/interaction";
import { Feature } from "ol";
import { Point } from "ol/geom";

const OGC_API_URL_TEST = new URL("https://example.org/ogc");
const DEFAULT_SLEEP = 50;
const HTTP_SERVICE: HttpService = {
    fetch: vi.fn().mockResolvedValue(
        new Response(null, {
            status: 204
        })
    )
} satisfies Partial<HttpService> as HttpService;

describe("starting update editing workflow", () => {
    it("should start an update editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        expect(workflow.getState()).toBe("active:initialized");

        workflow.stop();
    });

    it("should create an editing layer for an update editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        const { editingLayer } = getEditingLayerAndSource(map);
        expect(editingLayer).not.toBeUndefined();

        workflow.stop();
    });

    it("should add an interaction for an update editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        const interactions: Interaction[] = map.olMap.getInteractions().getArray();
        const modifyInteraction: Modify | undefined = interactions.find(
            (i) => i instanceof Modify
        ) as Modify;
        expect(modifyInteraction).not.toBeUndefined();

        workflow.stop();
    });

    it("should hold a geometry after starting an update editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        const { editingSource } = getEditingLayerAndSource(map);
        expect(editingSource.getFeatures().length).toBe(1);

        workflow.stop();
    });

    it("should start an update editing workflow after stopping another one", async () => {
        const { map } = await renderMap();

        const workflow = (await setupUpdateWorkflow(map)).workflow;
        expect(workflow.getState()).toBe("active:initialized");

        workflow.stop();
        expect(workflow.getState()).toBe("destroyed");

        const nextWorkflow = (await setupUpdateWorkflow(map)).workflow;
        expect(nextWorkflow.getState()).toBe("active:initialized");

        nextWorkflow.stop();
    });
});

describe("stopping update editing workflow", () => {
    it("should stop an update editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        expect(workflow.getState()).toBe("active:initialized");

        workflow.stop();
        expect(workflow.getState()).toBe("destroyed");
    });

    it("should remove the editing layer for an update editing workflow on stopping the workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        workflow.stop();

        const editingLayer = findEditingLayer(map);
        expect(editingLayer).toBeUndefined();
    });

    it("should remove an interaction for an update editing workflow  on stopping the workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        workflow.stop();

        const interactions: Interaction[] = map.olMap.getInteractions().getArray();
        const modifyInteraction: Modify | undefined = interactions.find(
            (i) => i instanceof Modify
        ) as Modify;
        expect(modifyInteraction).toBeUndefined();
    });
});

describe("during update editing workflow", () => {
    it("should change state after starting update editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        const modify = workflow.getModifyInteraction();
        expect(workflow.getState()).toBe("active:initialized");

        modify.dispatchEvent("modifystart");
        expect(workflow.getState()).toBe("active:drawing");

        workflow.stop();
    });

    it("should change state after finished update editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        const modify = workflow.getModifyInteraction();

        modify.dispatchEvent("modifystart");

        workflow.triggerSave();

        expect(workflow.getState()).toBe("active:saving");
    });

    it("should contain a modified geometry after starting update editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        const modify = workflow.getModifyInteraction();
        const { editingSource } = getEditingLayerAndSource(map);

        editingSource.getFeatures()[0]?.setGeometry(new Point([10, 51]));

        modify.dispatchEvent("modifystart");

        const feature = editingSource.getFeatures()[0];

        const geometry = feature?.getGeometry();

        expect(geometry).not.toBeUndefined();

        if (geometry instanceof Point) {
            expect(geometry.getCoordinates()).toStrictEqual([10, 51]);
        } else {
            throw new Error("geometry type wrong");
        }

        workflow.stop();
    });
});

describe("reset update editing workflow", () => {
    it("should change state after reset update editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        const modify = workflow.getModifyInteraction();
        expect(workflow.getState()).toBe("active:initialized");

        modify.dispatchEvent("modifystart");
        expect(workflow.getState()).toBe("active:drawing");

        workflow.reset();
        expect(workflow.getState()).toBe("active:initialized");

        workflow.stop();
    });

    it("should not remove interaction after reset update editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        workflow.reset();

        const interactions: Interaction[] = map.olMap.getInteractions().getArray();
        const modifyInteraction: Modify | undefined = interactions.find(
            (i) => i instanceof Modify
        ) as Modify;
        expect(modifyInteraction).not.toBeUndefined();

        workflow.stop();
    });

    it("should reset geometry after reset update editing workflow", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        const modify = workflow.getModifyInteraction();
        const { editingSource } = getEditingLayerAndSource(map);

        editingSource.getFeatures()[0]?.setGeometry(new Point([8, 51]));

        modify.dispatchEvent("modifystart");

        workflow.reset();

        const feature = editingSource.getFeatures()[0];
        if (!feature) {
            throw new Error("feature not found");
        }

        const geometry: Point = feature.getGeometry() as Point;
        if (!geometry) {
            throw new Error("geometry not found");
        }

        expect(geometry.getCoordinates()).toStrictEqual([0, 0]);

        workflow.stop();
    });
});

describe("when update editing workflow complete", () => {
    it("should return a feature id when update editing workflow is complete", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        const modify = workflow.getModifyInteraction();
        const { editingSource } = getEditingLayerAndSource(map);

        modify.dispatchEvent("modifystart");

        const feature = editingSource.getFeatures()[0];
        if (!feature) {
            throw new Error("feature not found");
        }

        workflow.triggerSave();

        await sleep(DEFAULT_SLEEP);

        const featureData = await workflow.whenComplete();
        expect(featureData?.featureId).toBe("test_id");
    });

    it("should return `undefined` if update editing workflow is stopped while modifying geometry", async () => {
        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map);
        const modify = workflow.getModifyInteraction();
        const { editingSource } = getEditingLayerAndSource(map);

        modify.dispatchEvent("modifystart");

        const feature = editingSource.getFeatures()[0];
        if (!feature) {
            throw new Error("feature not found");
        }

        workflow.stop();

        await sleep(DEFAULT_SLEEP);
        const featureData = await workflow.whenComplete();
        expect(featureData?.featureId).toBeUndefined();
    });

    it("should return an error if update editing workflow failed", async () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);

        const httpService: HttpService = {
            fetch: vi.fn().mockResolvedValue(
                new Response("", {
                    status: 401 // HTTP Unauthorized
                })
            )
        } satisfies Partial<HttpService> as HttpService;

        const { map } = await renderMap();
        const { workflow } = await setupUpdateWorkflow(map, httpService);
        const modify = workflow.getModifyInteraction();
        const { editingSource } = getEditingLayerAndSource(map);

        modify.dispatchEvent("modifystart");

        const feature = editingSource.getFeatures()[0];
        if (!feature) {
            throw new Error("feature not found");
        }

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

async function setupUpdateWorkflow(map: MapModel, httpService: HttpService = HTTP_SERVICE) {
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

    const feature = new Feature({ geometry: new Point([0, 0]) });
    feature.setId("test_id");

    const workflow = new EditingUpdateWorkflowImpl({
        map,
        ogcApiFeatureLayerUrl: OGC_API_URL_TEST,
        polygonStyle,
        vertexStyle,
        httpService,
        intl,
        feature
    });

    return { map, workflow };
}

function getEditingLayerAndSource(map: MapModel) {
    const editingLayer = findEditingLayer(map);
    if (!editingLayer) {
        throw new Error("editing layer not found");
    }

    const editingSource = editingLayer.getSource();
    if (!editingSource) {
        throw new Error("editing source not found");
    }

    return { editingLayer, editingSource };
}

function findEditingLayer(map: MapModel) {
    const layers = map.olMap.getLayers().getArray();
    const editingLayer = layers.find((l) => l.getProperties().name === "editing-layer") as
        | VectorLayer<Feature>
        | undefined;
    return editingLayer;
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}
