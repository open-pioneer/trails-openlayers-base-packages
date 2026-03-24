// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BoxProps } from "@chakra-ui/react";
import { setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapContainer, MapContainerProps } from "./MapContainer";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";

afterEach(() => {
    vi.restoreAllMocks();
});

it("successfully creates a map", async () => {
    const { map, container, unmount } = await renderMap();

    // Div is registered as map target
    const mapContainer = container.querySelector(".map-container");
    expect(mapContainer?.tagName).toBe("DIV");
    expect(map?.container).toBe(mapContainer);
    expect(map?.olMap.getTarget()).toBe(mapContainer);

    // Unmounting removes the container from the map
    unmount();
    expect(map?.olMap.getTarget()).toBeUndefined();
    expect(map?.container).toBeUndefined();
});

it("supports configuration of map container root properties", async () => {
    const { container } = await renderMap({
        rootProps: {
            "data-test": "foo"
        } as BoxProps
    });

    const mapContainerRoot = container.querySelector(".map-container-root");
    expect(mapContainerRoot).toHaveAttribute("data-test", "foo");
});

it("supports configuration of map container properties", async () => {
    const { container } = await renderMap({
        containerProps: {
            "data-test": "foo"
        } as BoxProps
    });

    const mapContainer = container.querySelector(".map-container");
    expect(mapContainer).toHaveAttribute("data-test", "foo");
});

it("supports configuring role and aria labels", async () => {
    const { container } = await renderMap({
        role: "region",
        /* note: don't mix aria label and aria-labelledby in a real application; this just tests that props are forwarded */
        "aria-label": "foo",
        "aria-labelledby": "does-not-exist",
        "data-testid": "base"
    });

    const mapContainer = container.querySelector(".map-container")!;
    expect(mapContainer.role).toBe("region");
    expect(mapContainer.getAttribute("aria-label")).toBe("foo");
    expect(mapContainer.getAttribute("aria-labelledby")).toEqual("does-not-exist");
});

it("does not change view padding on map if padding values are not changed", async () => {
    const initialPadding = { top: 10, right: 20, bottom: 30, left: 40 };
    const { map, rerender } = await renderMap({
        viewPadding: initialPadding
    });

    // expect initial padding is set
    expect(map.olView.padding).toEqual([10, 20, 30, 40]);

    // render with same padding
    let changeFired = false;
    map.olView.on("change", () => {
        changeFired = true;
    });
    rerender({
        // Equal values but new object reference
        viewPadding: { ...initialPadding }
    });

    // expect padding is unchanged
    expect(map.olView.padding).toEqual([10, 20, 30, 40]);
    expect(changeFired).toBe(false);
});

it("does update view padding on map if padding values are changed", async () => {
    const initialPadding = { top: 10, right: 20, bottom: 30, left: 40 };
    const { map, rerender } = await renderMap({
        viewPadding: initialPadding
    });

    // expect initial padding is set
    expect(map.olView.padding).toEqual([10, 20, 30, 40]);

    // update with changed padding
    let changeFired = false;
    map.olView.on("change", () => {
        changeFired = true;
    });

    rerender({
        viewPadding: {
            ...initialPadding,
            top: 15
        }
    });

    // expect padding is unchanged
    expect(map.olView.padding).toEqual([15, 20, 30, 40]);
    expect(changeFired).toBe(true);
});

it("reports an error if two map containers are used for the same map", async () => {
    const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
    const { map } = await setupMap();
    render(
        <PackageContextProvider>
            <div data-testid="base">
                <MapContainer map={map} />
                <MapContainer map={map} />
            </div>
        </PackageContextProvider>
    );
    await waitForMapMount();

    expect(logSpy).toMatchInlineSnapshot(`
      [MockFunction error] {
        "calls": [
          [
            "[ERROR] @open-pioneer/map/ui/MapContainer: Failed to display the map: the map already has a target. There may be more than one <MapContainer />.",
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
});

describe("attributions", () => {
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
        const attributionsDiv = await waitFor(() => {
            const div = container.querySelector(".ol-attribution");
            if (!div) {
                throw new Error("Attribution widget not found in dom");
            }
            return div as HTMLElement;
        });
        const items = getAttributionHtml(attributionsDiv);
        expect(items).toMatchInlineSnapshot(`
          [
            "attr 1",
            "attr 2",
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
        const attributionsDiv = await waitFor(() => {
            const div = container.querySelector(".ol-attribution");
            if (!div) {
                throw new Error("Attribution widget not found in dom");
            }
            return div as HTMLElement;
        });
        const items = getAttributionHtml(attributionsDiv);
        expect(items).toMatchInlineSnapshot(`
          [
            "<a href="https://example.com" target="_blank">© ExampleCompany</a>",
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
        const attributionsDiv = await waitFor(() => {
            const div = container.querySelector(".ol-attribution");
            if (!div) {
                throw new Error("Attribution widget not found in dom");
            }
            return div as HTMLElement;
        });
        const items = getAttributionHtml(attributionsDiv);
        expect(items).toMatchInlineSnapshot(`
          [
            "&lt;iframe&gt;Foo",
            "<a href="https://example.com">Link</a>",
          ]
        `);
    });

    function getAttributionHtml(attributionsDiv: HTMLElement) {
        const list = Array.from(attributionsDiv.querySelector("ul")!.querySelectorAll("li")!);
        return list.map((item) => item.innerHTML);
    }
});

async function renderMap(props?: MapContainerProps) {
    let map = props?.map;
    if (!map) {
        map = (await setupMap()).map;
    }

    const getMapContainer = (props?: MapContainerProps) => {
        return <MapContainer {...props} map={map} data-testid="map" />;
    };
    const renderResult = render(getMapContainer(props), {
        wrapper: (props) => <PackageContextProvider {...props} />
    });
    await waitForMapMount("map");

    return {
        map,
        ...renderResult,
        rerender(props?: MapContainerProps) {
            renderResult.rerender(getMapContainer(props));
        }
    };
}

function createAttributionLayer(attributions: string) {
    const vectorSource = new VectorSource({
        features: []
    });
    vectorSource.setAttributions(attributions);
    return new VectorLayer({ source: vectorSource });
}
