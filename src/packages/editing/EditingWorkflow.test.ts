// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { expect, it } from "vitest";
import BaseEvent from "ol/events/Event";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OlMap from "ol/Map";
import Draw from "ol/interaction/Draw";
import { FlatStyleLike } from "ol/style/flat";
import { HttpService } from "@open-pioneer/http";
import { setupMap } from "@open-pioneer/map-test-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import { EditingWorkflow } from "./EditingWorkflow";

it("should remove the started drawing after reset", async () => {
    const { workflow, map } = await setup();

    expect(workflow.getState()).toBe("active:initialized");

    // evaluate if editing-layer exists in map
    const editingLayer: VectorLayer<VectorSource> | undefined = map.olMap
        .getLayers()
        .getArray()
        .find((l) => l.getProperties().name === "editing-layer") as VectorLayer<VectorSource>;

    expect(editingLayer).not.toBe(undefined);
    if (!editingLayer) {
        throw new Error("editing layer not found");
    }

    // check that editing layer source does not contain a geometry
    const editingSource = editingLayer.getSource();
    if (!editingSource) {
        throw new Error("editing source not found");
    }
    expect(editingSource.getFeatures().length).toBe(0);

    const beginTooltip = getTooltipElement(map.olMap, "editing-tooltip");
    expect(beginTooltip.innerHTML).toMatchInlineSnapshot('"tooltip.begin"');

    const clickOnMap = (x: number, y: number) => {
        const fakeClickEvent = new BaseEvent("click");
        (fakeClickEvent as any).coordinate = [x, y];
        map.olMap.dispatchEvent(fakeClickEvent);
    };
 
    // start drawing geometry
    clickOnMap(200, 200);

    expect(workflow.getState()).toBe("active:drawing");
    
    // TODO drawinteraction bzw. temporäre Layersource enthält angefangene Geometrie

    // check that map contains a draw interaction
    const drawInteractionStart: Draw | undefined = map.olMap
        .getInteractions()
        .getArray()
        .find((i) => i instanceof Draw) as Draw;
    expect(drawInteractionStart).not.toBe(undefined);

    const continueTooltip = getTooltipElement(map.olMap, "editing-tooltip");
    expect(continueTooltip.innerHTML).toMatchInlineSnapshot('"tooltip.continue"');

    workflow.reset();

    expect(workflow.getState()).toBe("active:initialized");
    /*
    // TODO OL-Map enthält weiterhin temporären Zeichenlayer
    console.log(map.olMap.getLayers());
    // TODO temporäre Layersource leer?
    console.log(map.olMap.getLayers()[0].getSource());
    */
    // TODO OL-Map enthält weiterhin Interaction
    console.log(map.olMap.getInteractions());

    // check that draw interaction was not removed (like after stop)
    const drawInteractionReset: Draw | undefined = map.olMap
        .getInteractions()
        .getArray()
        .find((i) => i instanceof Draw) as Draw;
    expect(drawInteractionReset).not.toBe(undefined);

    const resetTooltip = getTooltipElement(map.olMap, "editing-tooltip");
    expect(resetTooltip.innerHTML).toMatchInlineSnapshot('"tooltip.begin"');
});

async function setup() {
    const httpService: HttpService = {
        async fetch() {
            return new Response("mock response from map-test-utils", {
                status: 200
            });
        }
    };

    const intl = {
        formatMessage(props: any) {
            return props.id;
        }
    } satisfies Partial<PackageIntl> as PackageIntl;

    const { mapId, registry } = await setupMap();

    const map = await registry.expectMapModel(mapId);
    const ogcApiFeatureLayerUrl = new URL("https://example.org/ogc");
    const polygonDrawStyle: FlatStyleLike = {
        "stroke-color": "yellow",
        "stroke-width": 2,
        "fill-color": "rgba(0, 0, 0, 0.1)",
        "circle-radius": 5,
        "circle-fill-color": "rgba(0, 0, 255, 0.2)",
        "circle-stroke-color": "rgba(0, 0, 255, 0.7)",
        "circle-stroke-width": 2
    };

    const workflow = new EditingWorkflow(
        map,
        ogcApiFeatureLayerUrl,
        polygonDrawStyle,
        httpService,
        registry,
        intl
    );

    return { workflow, map, ogcApiFeatureLayerUrl };
}

function getTooltipElement(olMap: OlMap, className: string): HTMLElement {
    const allOverlays = olMap.getOverlays().getArray();
    const tooltips = allOverlays.filter((ol) => ol.getElement()?.classList.contains(className));
    if (tooltips.length === 0) {
        throw Error("did not find any tooltips");
    }
    if (tooltips.length > 1) {
        throw Error("found multiple tooltips");
    }

    const element = tooltips[0]!.getElement();
    if (!element) {
        throw new Error("tooltip overlay did not have an element");
    }
    return element;
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}
