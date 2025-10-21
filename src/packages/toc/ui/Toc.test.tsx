// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { nextTick } from "@conterra/reactivity-core";
import { GroupLayer, Layer, SimpleLayerConfig } from "@open-pioneer/map";
import { createTestLayer, createTestOlLayer, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { TocDisposedEvent, TocReadyEvent } from "../model";
import { Toc } from "./Toc";

const BASEMAP_SWITCHER_CLASS = ".basemap-switcher";
const BASEMAP_SWITCHER_SELECT_CLASS = ".basemap-switcher-select";
const BASEMAP_SWITCHER_CONTENT_CLASS = ".basemap-switcher-select-content";
const BASEMAP_SWITCHER_TRIGGER_CLASS = ".basemap-switcher-select-trigger";

it("should successfully create a toc component", async () => {
    const { map, Wrapper } = await setupTocContext();
    render(<Toc map={map} data-testid="toc" />, {
        wrapper: Wrapper
    });

    const tocDiv = await findToc();
    const { basemapSelectTrigger } = await waitForBasemapSwitcher(tocDiv!);

    // select lazy mounts the list of options in dom after opening selection
    await act(async () => {
        fireEvent.click(basemapSelectTrigger);
        await nextTick();
    });

    await waitFor(() => {
        //options are portalled
        const basemapSwitcherContent = document.querySelector(BASEMAP_SWITCHER_CONTENT_CLASS);
        if (!basemapSwitcherContent) {
            throw new Error("expected basemap switcher content not rendered");
        }
        const options = basemapSwitcherContent.getElementsByClassName("basemap-switcher-option");
        if (options.length !== 1 || options[0]?.textContent !== "Base layer") {
            throw new Error("expected basemap switcher to contain the Base layer option");
        }
    });
    expect(tocDiv).toMatchSnapshot();
});

it("should successfully create a toc component with additional css classes", async () => {
    const { map, Wrapper } = await setupTocContext([]);
    render(<Toc map={map} className="test" data-testid="toc" />, {
        wrapper: Wrapper
    });

    const tocDiv = await findToc();
    expect(tocDiv.classList.contains("test")).toBe(true);
});

it("should embed the basemap switcher by default", async () => {
    const { map, Wrapper } = await setupTocContext([]);
    render(<Toc map={map} data-testid="toc" />, {
        wrapper: Wrapper
    });

    const tocDiv = await findToc();
    const { basemapSwitcher } = await waitForBasemapSwitcher(tocDiv!);
    expect(basemapSwitcher.tagName).toBe("DIV");
});

it("should not show the basemap switcher if 'showBasemapSwitcher' is set to false", async () => {
    const { map, Wrapper } = await setupTocContext([]);
    render(<Toc map={map} showBasemapSwitcher={false} data-testid="toc" />, {
        wrapper: Wrapper
    });

    const tocDiv = await findToc();
    const basemapSwitcher = tocDiv.querySelector(BASEMAP_SWITCHER_CLASS);
    expect(basemapSwitcher).toBeNull();
});

it("should support overriding basemap-switcher properties", async () => {
    const { map, Wrapper } = await setupTocContext([
        {
            title: "OSM",
            olLayer: createTestOlLayer(),
            isBaseLayer: true
        }
    ]);
    render(
        <Toc
            map={map}
            basemapSwitcherProps={{
                allowSelectingEmptyBasemap: true,
                className: "test-class"
            }}
            data-testid="toc"
        />,
        {
            wrapper: Wrapper
        }
    );

    const tocDiv = await findToc();
    const { basemapSwitcher, basemapSelect } = await waitForBasemapSwitcher(tocDiv!);
    expect(basemapSwitcher?.classList.contains("test-class")).toBe(true);

    // react-select creates list of options in dom after opening selection
    act(() => {
        fireEvent.keyDown(basemapSelect, { key: "ArrowDown" });
    });

    await waitFor(() => {
        const options = basemapSelect.getElementsByClassName("basemap-switcher-option");
        const optionLabels = Array.from(options).map((opt) => opt.textContent);
        expect(
            optionLabels,
            "basemap options are not equal to their expected values"
        ).toMatchInlineSnapshot(`[]`);
    });
});

describe("toc api", () => {
    it("should raise onReady and onDispose events", async () => {
        const { map, Wrapper } = await setupTocContext();

        let readyEvent: TocReadyEvent | undefined;
        const onReadyHandler = (e: TocReadyEvent) => {
            readyEvent = e;
        };
        let disposedEvent: TocDisposedEvent | undefined;
        const onDisposedHandler = (e: TocDisposedEvent) => {
            disposedEvent = e;
        };

        const onReadyMock = vi.fn().mockImplementation(onReadyHandler);
        const onDisposedMock = vi.fn().mockImplementation(onDisposedHandler);

        const { unmount } = render(
            <Toc map={map} data-testid="toc" onDisposed={onDisposedMock} onReady={onReadyMock} />,
            { wrapper: Wrapper }
        );
        await findToc();

        await waitFor(() => {
            expect(onReadyMock).toBeCalled();
        });
        expect(readyEvent).toBeDefined();
        expect(readyEvent?.api).toBeDefined();

        unmount(); //unmount toc

        await waitFor(() => {
            expect(onDisposedMock).toBeCalled();
        });
        expect(disposedEvent).toBeDefined();

        //should have been called exactly once
        expect(onReadyMock).toBeCalledTimes(1);
        expect(onDisposedMock).toBeCalledTimes(1);
    });

    it("should return TocItems for layers via Toc API", async () => {
        const { map, Wrapper } = await setupTocContext();

        let readyEvent: TocReadyEvent | undefined;
        const onReadyHandler = (e: TocReadyEvent) => {
            readyEvent = e;
        };
        const onReadyMock = vi.fn().mockImplementation(onReadyHandler);

        render(<Toc map={map} data-testid="toc" onReady={onReadyMock} />, { wrapper: Wrapper });
        await findToc();

        await waitFor(() => {
            expect(onReadyMock).toBeCalled();
        });
        expect(readyEvent!.api).toBeDefined();

        const api = readyEvent!.api;
        const tocItems = api.getItems();
        expect(tocItems?.length).toBe(2); //only two items because one layer is a base layer
        expect(api.getItemByLayerId("base-layer")).toBeUndefined();
        expect(api.getItemByLayerId("layer-1")).toBeDefined();
        expect(api.getItemByLayerId("layer-2")).toBeDefined();
    });

    it("should provide access to LayerItem HTMLElement via Toc API", async () => {
        const { map, Wrapper } = await setupTocContext();

        let readyEvent: TocReadyEvent | undefined;
        const onReadyHandler = (e: TocReadyEvent) => {
            readyEvent = e;
        };

        const onReadyMock = vi.fn().mockImplementation(onReadyHandler);
        const onDisposedMock = vi.fn();

        const { unmount } = render(
            <Toc map={map} data-testid="toc" onDisposed={onDisposedMock} onReady={onReadyMock} />,
            {
                wrapper: Wrapper
            }
        );
        await findToc();

        await waitFor(() => {
            expect(onReadyMock).toBeCalled();
        });
        expect(readyEvent).toBeDefined();
        expect(readyEvent?.api).toBeDefined();

        const api = readyEvent!.api;
        const tocItem = api.getItemByLayerId("layer-1");
        expect(tocItem).toBeDefined();

        const htmlElement = tocItem?.htmlElement;
        expect(htmlElement).toBeTruthy();
        expect(htmlElement!.classList).toContain("toc-layer-item");

        unmount(); //unmount toc;

        await waitFor(() => {
            expect(onDisposedMock).toBeCalled();
        });

        expect(tocItem?.htmlElement).toBeUndefined();
    });

    it("should toggle LayerItem via Toc API", async () => {
        const group = createTestLayer({
            type: GroupLayer,
            id: "group",
            title: "a group layer",
            visible: false,
            layers: [
                createTestLayer({
                    type: GroupLayer,
                    id: "subgroup",
                    title: "a nested group layer",
                    visible: false,
                    layers: [
                        createTestLayer({
                            id: "submember",
                            title: "subgroup member",
                            olLayer: createTestOlLayer(),
                            visible: false
                        })
                    ]
                })
            ]
        });
        const { map, Wrapper } = await setupTocContext([group]);
        let readyEvent: TocReadyEvent | undefined;
        const onReadyHandler = (e: TocReadyEvent) => {
            readyEvent = e;
        };

        const onReadyMock = vi.fn().mockImplementation(onReadyHandler);

        render(
            <Toc map={map} data-testid="toc" onReady={onReadyMock} initiallyCollapsed={true} />,
            { wrapper: Wrapper }
        );
        await findToc();

        await waitFor(() => {
            expect(onReadyMock).toBeCalled();
        });
        expect(readyEvent).toBeDefined();
        expect(readyEvent!.api).toBeDefined();

        const api = readyEvent!.api;
        const tocItemSubgroup = api.getItemByLayerId("subgroup")!;
        expect(tocItemSubgroup).toBeDefined();
        expect(tocItemSubgroup.isExpanded).toBeFalsy();

        const tocItemGroup = api.getItemByLayerId("group")!;
        expect(tocItemGroup).toBeDefined();
        expect(tocItemGroup.isExpanded).toBeFalsy();

        tocItemSubgroup.setExpanded(true); //initially collapsed
        expect(tocItemSubgroup.isExpanded).toBeTruthy();
        expect(tocItemGroup.isExpanded).toBeTruthy(); //should expand parent by default

        tocItemSubgroup.setExpanded(false);
        expect(tocItemSubgroup.isExpanded).toBeFalsy();
        expect(tocItemGroup.isExpanded).toBeTruthy(); //should not collapse parent by default

        tocItemSubgroup.setExpanded(false, { bubble: true });
        expect(tocItemSubgroup.isExpanded).toBeFalsy();
        expect(tocItemGroup.isExpanded).toBeFalsy(); //should collapse parent as well if bubble is explicitly true

        tocItemSubgroup.setExpanded(true, { bubble: false });
        expect(tocItemSubgroup.isExpanded).toBeTruthy();
        expect(tocItemGroup.isExpanded).toBeFalsy(); //should not expand parent as well if bubble is false
    });
});

async function setupTocContext(layers?: (SimpleLayerConfig | Layer)[]) {
    const { map } = await setupMap({
        layers: layers ?? [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: createTestOlLayer(),
                isBaseLayer: true
            },
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer()
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: createTestOlLayer()
            }
        ]
    });
    const Wrapper = (props: { children?: ReactNode }) => {
        return <PackageContextProvider>{props.children}</PackageContextProvider>;
    };
    return { map, Wrapper };
}

async function findToc() {
    return await screen.findByTestId("toc");
}

async function waitForBasemapSwitcher(tocDiv: HTMLElement) {
    return await waitFor(() => {
        const basemapSwitcher = tocDiv.querySelector(BASEMAP_SWITCHER_CLASS);
        if (!basemapSwitcher) {
            throw new Error("basemap switcher not mounted");
        }

        const basemapSelect = basemapSwitcher?.querySelector(BASEMAP_SWITCHER_SELECT_CLASS);
        if (!basemapSelect) {
            throw new Error("failed to find select element in basemap switcher");
        }

        const basemapSelectTrigger = basemapSwitcher?.querySelector(BASEMAP_SWITCHER_TRIGGER_CLASS);
        if (!basemapSelectTrigger) {
            throw new Error("failed to find trigger element in basemap switcher");
        }

        return { basemapSwitcher, basemapSelect, basemapSelectTrigger };
    });
}
