// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { effect } from "@conterra/reactivity-core";
import { setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { render, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AttributionItem, MapModel } from "../model/MapModel";
import { MapContainer, MapContainerProps } from "../ui/MapContainer";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";

it("renders attributions for layers in the map", async () => {
    const { map } = await setupMap({
        layers: [
            {
                title: "Layer1",
                olLayer: createAttributionLayer("attr 1")
            },
            {
                title: "Layer2",
                olLayer: createAttributionLayer("attr 2")
            }
        ]
    });

    const { container } = await renderMap({ map });
    const attributionsDiv = await getAttributionsContainer(container);
    const items = getAttributionHtml(attributionsDiv);
    expect(items).toMatchInlineSnapshot(`
          [
            "attr 1",
            "attr 2",
          ]
        `);
    expect(map.attributionItems).toMatchInlineSnapshot(`
          [
            {
              "text": "attr 1",
            },
            {
              "text": "attr 2",
            },
          ]
        `);
});

it("allows simple html in attributions", async () => {
    const rawHtml = `<a href="https://example.com" target="_blank">&copy; ExampleCompany</a>`;
    const { map } = await setupMap({
        layers: [
            {
                title: "Layer1",
                olLayer: createAttributionLayer(rawHtml)
            }
        ]
    });

    const { container } = await renderMap({ map });
    const attributionsDiv = await getAttributionsContainer(container);
    const items = getAttributionHtml(attributionsDiv);
    expect(items).toMatchInlineSnapshot(`
          [
            "<a href="https://example.com" target="_blank">© ExampleCompany</a>",
          ]
        `);
    expect(map.attributionItems).toMatchInlineSnapshot(`
          [
            {
              "text": "<a href="https://example.com" target="_blank">&copy; ExampleCompany</a>",
            },
          ]
        `);
});

it("sanitizes invalid html", async () => {
    // This should be escaped
    const invalidHtml = `<iframe>Foo`;

    // This uses a script tag which should be removed
    const xssString = `<a href="https://example.com" onclick="alert(1)">Link</a>`;

    const { map } = await setupMap({
        layers: [
            {
                title: "Layer1",
                olLayer: createAttributionLayer(invalidHtml)
            },
            {
                title: "Layer2",
                olLayer: createAttributionLayer(xssString)
            }
        ]
    });

    const { container } = await renderMap({ map });
    const attributionsDiv = await getAttributionsContainer(container);
    const items = getAttributionHtml(attributionsDiv);
    expect(items).toMatchInlineSnapshot(`
          [
            "&lt;iframe&gt;Foo",
            "<a href="https://example.com">Link</a>",
          ]
        `);
    expect(map.attributionItems).toMatchInlineSnapshot(`
          [
            {
              "text": "&lt;iframe&gt;Foo",
            },
            {
              "text": "<a href="https://example.com">Link</a>",
            },
          ]
        `);
});

// NOTE: The map must be rendered for attributions API on the MapModel to work
it("provides reactive attribution items via mapModel.attributionItems", async () => {
    const { map } = await setupMap({
        // Explicitly disable the default control to test that the items are still provided
        showAttributions: false,
        layers: [
            {
                id: "test-layer",
                title: "Layer1",
                olLayer: createAttributionLayer("test")
            }
        ]
    });
    const { container } = await renderMap({ map });

    // attributionItems are provided even if the default attributions widget is not present
    await expect(() => getAttributionsContainer(container, 25)).rejects.toThrow(
        /Attribution widget not found in dom/
    );

    let items: AttributionItem[] = [];
    effect(() => {
        items = map.attributionItems;
    });

    // Layer is visible -> attributions present
    await vi.waitUntil(() => items.length > 0);
    expect(items).toMatchInlineSnapshot(`
          [
            {
              "text": "test",
            },
          ]
        `);

    // Attributions gone when layer becomes invisible
    map.layers.getLayerById("test-layer")!.setVisible(false);
    await vi.waitUntil(() => items.length === 0);
});

async function getAttributionsContainer(container: HTMLElement, timeout?: number) {
    return await waitFor(
        () => {
            const div = container.querySelector(".ol-attribution");
            if (!div) {
                throw new Error("Attribution widget not found in dom");
            }
            return div as HTMLElement;
        },
        { timeout }
    );
}

function getAttributionHtml(attributionsDiv: HTMLElement) {
    const list = Array.from(attributionsDiv.querySelector("ul")!.querySelectorAll("li")!);
    return list.map((item) => item.innerHTML);
}

function createAttributionLayer(attributions: string) {
    const vectorSource = new VectorSource({
        features: []
    });
    vectorSource.setAttributions(attributions);
    return new VectorLayer({ source: vectorSource });
}

async function renderMap(props?: MapContainerProps & { map: MapModel }) {
    const getMapContainer = (props?: MapContainerProps) => {
        return <MapContainer {...props} data-testid="map" />;
    };
    const renderResult = render(getMapContainer(props), {
        wrapper: (props) => <PackageContextProvider {...props} />
    });
    await waitForMapMount("map");
    return renderResult;
}
