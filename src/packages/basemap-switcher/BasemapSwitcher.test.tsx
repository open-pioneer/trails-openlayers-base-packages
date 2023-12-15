// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BkgTopPlusOpen, SimpleLayer } from "@open-pioneer/map";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { describe, expect, it } from "vitest";
import { BasemapSwitcher } from "./BasemapSwitcher";

const defaultBasemapConfig = [
    {
        id: "osm",
        title: "OSM",
        isBaseLayer: true,
        visible: true,
        olLayer: new TileLayer({})
    },
    {
        id: "topplus-open",
        title: "TopPlus Open",
        isBaseLayer: true,
        visible: false,
        olLayer: new TileLayer({})
    }
];

it("should successfully create a basemap switcher component", async () => {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId); // wait for model load

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} allowSelectingEmptyBasemap data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherDiv, switcherSelect } = await waitForBasemapSwitcher();
    showDropdown(switcherSelect);
    expect(switcherDiv).toMatchSnapshot();

    // check basemap switcher box and select is available
    expect(switcherDiv.tagName).toBe("DIV");
    expect(switcherSelect.tagName).toBe("DIV");
    expect(switcherSelect.getElementsByTagName("input").length).toBe(1);
});

it("should successfully create a basemap switcher component with additional css classes and box properties", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });
    await registry.expectMapModel(mapId); // wait for model load

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} className="test" data-testid="switcher" />
        </PackageContextProvider>
    );

    const { switcherDiv } = await waitForBasemapSwitcher();
    expect(switcherDiv.classList.contains("test")).toBe(true);
    expect(switcherDiv.classList.contains("foo")).toBe(false);
});

it("should successfully select a basemap from basemap switcher", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });
    const map = await registry.expectMapModel(mapId);

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();
    showDropdown(switcherSelect);

    let options = getCurrentOptions(switcherSelect);
    const osmOption = options.find((option) => option.textContent === "OSM");
    if (!osmOption) {
        throw new Error("Layer OSM missing in basemap options");
    }
    await user.click(osmOption);

    const firstActiveBaseLayer = map.layers.getActiveBaseLayer();
    expect(firstActiveBaseLayer?.id).toBe("osm");

    showDropdown(switcherSelect);
    options = getCurrentOptions(switcherSelect);
    const topPlusOption = options.find((option) => option.textContent === "TopPlus Open");
    if (!topPlusOption) {
        throw new Error("Layer topplus-open missing in basemap options");
    }
    await user.click(topPlusOption);

    const nextActiveBaseLayer = map.layers.getActiveBaseLayer();
    expect(nextActiveBaseLayer?.id).toBe("topplus-open");
});

it("should allow selecting 'no basemap' when enabled", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });

    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} allowSelectingEmptyBasemap data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();

    expect(switcherSelect.textContent).toBe("OSM");
    expect(map.layers.getActiveBaseLayer()?.id).toBe("osm");
    showDropdown(switcherSelect);

    expect(switcherSelect).toMatchInlineSnapshot(`
      <div
        class="basemap-switcher-select react-select--has-value css-79elbk"
        data-theme="light"
      >
        <span
          class="css-1f43avz-a11yText-A11yText"
          id="react-select-5-live-region"
        />
        <span
          aria-atomic="false"
          aria-live="polite"
          aria-relevant="additions text"
          class="css-1f43avz-a11yText-A11yText"
        />
        <div
          class="react-select__control react-select__control--menu-is-open css-i2418r"
          data-theme="light"
        >
          <div
            class="react-select__value-container react-select__value-container--has-value css-j93siq"
            data-theme="light"
          >
            <div
              class="basemap-switcher-value react-select__single-value css-1xa1gs2"
              data-theme="light"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                OSM
              </div>
            </div>
            <input
              aria-autocomplete="list"
              aria-controls="react-select-5-listbox"
              aria-expanded="true"
              aria-haspopup="true"
              aria-owns="react-select-5-listbox"
              aria-readonly="true"
              class="css-mohuvp-dummyInput-DummyInput"
              id="react-select-5-input"
              inputmode="none"
              role="combobox"
              tabindex="0"
              value=""
            />
          </div>
          <div
            class="react-select__indicators css-hfbj6y"
            data-theme="light"
          >
            <hr
              aria-orientation="vertical"
              class="chakra-divider react-select__indicator-separator css-1i6c5ox"
              data-theme="light"
            />
            <div
              aria-hidden="true"
              class="react-select__indicator react-select__dropdown-indicator css-xq12md"
              data-theme="light"
            >
              <svg
                aria-hidden="true"
                class="chakra-icon css-onkibi"
                data-theme="light"
                focusable="false"
                role="presentation"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
        </div>
        <div
          class="react-select__menu css-ky7590"
          data-theme="light"
          id="react-select-5-listbox"
        >
          <div
            class="react-select__menu-list css-1h5avke"
            data-theme="light"
            role="listbox"
          >
            <div
              aria-selected="true"
              class="basemap-switcher-option react-select__option react-select__option--is-focused react-select__option--is-selected css-e8c6zu"
              data-focus="true"
              data-theme="light"
              id="react-select-5-option-0"
              role="option"
              tabindex="-1"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                OSM
              </div>
            </div>
            <div
              aria-selected="false"
              class="basemap-switcher-option react-select__option css-e8c6zu"
              data-theme="light"
              id="react-select-5-option-1"
              role="option"
              tabindex="-1"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                TopPlus Open
              </div>
            </div>
            <div
              aria-selected="false"
              class="basemap-switcher-option react-select__option css-e8c6zu"
              data-theme="light"
              id="react-select-5-option-2"
              role="option"
              tabindex="-1"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                emptyBasemapLabel
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    showDropdown(switcherSelect);
    const options = getCurrentOptions(switcherSelect);
    const optionsBasemap = options.find((option) => option.textContent === "emptyBasemapLabel");
    if (!optionsBasemap) {
        throw new Error("Layer Basemap missing in basemap options");
    }
    await user.click(optionsBasemap);

    expect(switcherSelect.textContent).toBe("emptyBasemapLabel");
    expect(map.layers.getActiveBaseLayer()).toBe(undefined);
});

it("should not allow selecting 'no basemap' by default", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });

    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();

    expect(switcherSelect.textContent).toBe("OSM");
    expect(map.layers.getActiveBaseLayer()?.id).toBe("osm");

    showDropdown(switcherSelect);

    expect(switcherSelect).toMatchInlineSnapshot(`
      <div
        class="basemap-switcher-select react-select--has-value css-79elbk"
        data-theme="light"
      >
        <span
          class="css-1f43avz-a11yText-A11yText"
          id="react-select-6-live-region"
        />
        <span
          aria-atomic="false"
          aria-live="polite"
          aria-relevant="additions text"
          class="css-1f43avz-a11yText-A11yText"
        />
        <div
          class="react-select__control react-select__control--menu-is-open css-i2418r"
          data-theme="light"
        >
          <div
            class="react-select__value-container react-select__value-container--has-value css-j93siq"
            data-theme="light"
          >
            <div
              class="react-select__single-value css-1xa1gs2"
              data-theme="light"
            >
              OSM
            </div>
            <input
              aria-autocomplete="list"
              aria-controls="react-select-6-listbox"
              aria-expanded="true"
              aria-haspopup="true"
              aria-owns="react-select-6-listbox"
              aria-readonly="true"
              class="css-mohuvp-dummyInput-DummyInput"
              id="react-select-6-input"
              inputmode="none"
              role="combobox"
              tabindex="0"
              value=""
            />
          </div>
          <div
            class="react-select__indicators css-hfbj6y"
            data-theme="light"
          >
            <hr
              aria-orientation="vertical"
              class="chakra-divider react-select__indicator-separator css-1i6c5ox"
              data-theme="light"
            />
            <div
              aria-hidden="true"
              class="react-select__indicator react-select__dropdown-indicator css-xq12md"
              data-theme="light"
            >
              <svg
                aria-hidden="true"
                class="chakra-icon css-onkibi"
                data-theme="light"
                focusable="false"
                role="presentation"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
        </div>
        <div
          class="react-select__menu css-ky7590"
          data-theme="light"
          id="react-select-6-listbox"
        >
          <div
            class="react-select__menu-list css-1h5avke"
            data-theme="light"
            role="listbox"
          >
            <div
              aria-selected="true"
              class="basemap-switcher-option react-select__option react-select__option--is-focused react-select__option--is-selected css-e8c6zu"
              data-focus="true"
              data-theme="light"
              id="react-select-6-option-0"
              role="option"
              tabindex="-1"
            >
              OSM
            </div>
            <div
              aria-selected="false"
              class="basemap-switcher-option react-select__option css-e8c6zu"
              data-theme="light"
              id="react-select-6-option-1"
              role="option"
              tabindex="-1"
            >
              TopPlus Open
            </div>
          </div>
        </div>
      </div>
    `);

    showDropdown(switcherSelect);
    const options = getCurrentOptions(switcherSelect);
    const optionsEmptyBasemap = options.filter(
        (option) => option.textContent === "emptyBasemapLabel"
    );
    expect(optionsEmptyBasemap).toHaveLength(0);
});

it("should update when a new basemap is registered", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });

    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();
    showDropdown(switcherSelect);

    let options = getCurrentOptions(switcherSelect);
    expect(options.length).toBe(2);

    act(() => {
        const layer = new SimpleLayer({
            id: "foo",
            title: "Foo",
            isBaseLayer: true,
            olLayer: new TileLayer({})
        });
        map.layers.addLayer(layer);
    });

    options = getCurrentOptions(switcherSelect);
    expect(options.length).toBe(3);

    expect(switcherSelect).toMatchInlineSnapshot(`
      <div
        class="basemap-switcher-select react-select--has-value css-79elbk"
        data-theme="light"
      >
        <span
          class="css-1f43avz-a11yText-A11yText"
          id="react-select-7-live-region"
        />
        <span
          aria-atomic="false"
          aria-live="polite"
          aria-relevant="additions text"
          class="css-1f43avz-a11yText-A11yText"
        />
        <div
          class="react-select__control react-select__control--menu-is-open css-i2418r"
          data-theme="light"
        >
          <div
            class="react-select__value-container react-select__value-container--has-value css-j93siq"
            data-theme="light"
          >
            <div
              class="basemap-switcher-value react-select__single-value css-1xa1gs2"
              data-theme="light"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                OSM
              </div>
            </div>
            <input
              aria-autocomplete="list"
              aria-controls="react-select-7-listbox"
              aria-expanded="true"
              aria-haspopup="true"
              aria-owns="react-select-7-listbox"
              aria-readonly="true"
              class="css-mohuvp-dummyInput-DummyInput"
              id="react-select-7-input"
              inputmode="none"
              role="combobox"
              tabindex="0"
              value=""
            />
          </div>
          <div
            class="react-select__indicators css-hfbj6y"
            data-theme="light"
          >
            <hr
              aria-orientation="vertical"
              class="chakra-divider react-select__indicator-separator css-1i6c5ox"
              data-theme="light"
            />
            <div
              aria-hidden="true"
              class="react-select__indicator react-select__dropdown-indicator css-xq12md"
              data-theme="light"
            >
              <svg
                aria-hidden="true"
                class="chakra-icon css-onkibi"
                data-theme="light"
                focusable="false"
                role="presentation"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
        </div>
        <div
          class="react-select__menu css-ky7590"
          data-theme="light"
          id="react-select-7-listbox"
        >
          <div
            class="react-select__menu-list css-1h5avke"
            data-theme="light"
            role="listbox"
          >
            <div
              aria-selected="true"
              class="basemap-switcher-option react-select__option react-select__option--is-focused react-select__option--is-selected css-e8c6zu"
              data-focus="true"
              data-theme="light"
              id="react-select-7-option-0"
              role="option"
              tabindex="-1"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                OSM
              </div>
            </div>
            <div
              aria-selected="false"
              class="basemap-switcher-option react-select__option css-e8c6zu"
              data-theme="light"
              id="react-select-7-option-1"
              role="option"
              tabindex="-1"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                TopPlus Open
              </div>
            </div>
            <div
              aria-selected="false"
              class="basemap-switcher-option react-select__option css-e8c6zu"
              data-theme="light"
              id="react-select-7-option-2"
              role="option"
              tabindex="-1"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                Foo
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
});

it("should update when a different basemap is activated from somewhere else", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });

    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();
    expect(switcherSelect.textContent).toBe("OSM");
    expect(map.layers.getActiveBaseLayer()?.id).toBe("osm");

    act(() => {
        map.layers.activateBaseLayer("topplus-open");
    });
    expect(switcherSelect.textContent).toBe("TopPlus Open");
});

describe("should successfully select the correct basemap from basemap switcher", () => {
    it("basemap with id `osm` is visible", async () => {
        const { mapId, registry } = await setupMap({
            layers: [
                {
                    id: "osm",
                    title: "OSM",
                    isBaseLayer: true,
                    visible: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                },
                {
                    id: "topplus-open",
                    title: "TopPlus Open",
                    isBaseLayer: true,
                    visible: false,
                    olLayer: new TileLayer({
                        source: new BkgTopPlusOpen()
                    })
                }
            ]
        });

        const map = await registry.expectMapModel(mapId);
        const injectedServices = createServiceOptions({ registry });
        render(
            <PackageContextProvider services={injectedServices}>
                <BasemapSwitcher mapId={mapId} data-testid="switcher" />
            </PackageContextProvider>
        );

        // basemap switcher is mounted
        const { switcherSelect } = await waitForBasemapSwitcher();
        expect(switcherSelect.textContent).toBe("OSM");
        expect(switcherSelect.textContent).not.toBe("TopPlus Open");

        const activeBaseLayer = map.layers.getActiveBaseLayer();
        expect(activeBaseLayer?.id).toBe("osm");
    });

    it("basemap with id `toner` is visible", async () => {
        const { mapId, registry } = await setupMap({
            layers: [
                {
                    id: "osm",
                    title: "OSM",
                    isBaseLayer: true,
                    visible: false,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                },
                {
                    id: "topplus-open",
                    title: "TopPlus Open",
                    isBaseLayer: true,
                    visible: true,
                    olLayer: new TileLayer({
                        source: new BkgTopPlusOpen()
                    })
                }
            ]
        });

        const map = await registry.expectMapModel(mapId);
        const injectedServices = createServiceOptions({ registry });
        render(
            <PackageContextProvider services={injectedServices}>
                <BasemapSwitcher mapId={mapId} data-testid="switcher" />
            </PackageContextProvider>
        );

        // basemap switcher is mounted
        const { switcherSelect } = await waitForBasemapSwitcher();
        expect(switcherSelect.textContent).toBe("TopPlus Open");
        expect(switcherSelect.textContent).not.toBe("OSM");

        const activeBaseLayer = map.layers.getActiveBaseLayer();
        expect(activeBaseLayer?.id).toBe("topplus-open");
    });
});

it("should deactivate unavailable layers for selection", async () => {
    const osmSource = new OSM();
    const topPlusSource = new BkgTopPlusOpen();

    const { mapId, registry } = await setupMap({
        layers: [
            {
                id: "osm",
                title: "OSM",
                isBaseLayer: true,
                visible: true,
                olLayer: new TileLayer({
                    source: osmSource
                })
            },
            {
                id: "topplus-open",
                title: "TopPlus Open",
                isBaseLayer: true,
                visible: true,
                olLayer: new TileLayer({
                    source: topPlusSource
                })
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();

    let activeBaseLayer = map.layers.getActiveBaseLayer();
    expect(activeBaseLayer?.id).toBe("osm");

    showDropdown(switcherSelect);
    expect(switcherSelect).toMatchInlineSnapshot(`
      <div
        class="basemap-switcher-select react-select--has-value css-79elbk"
        data-theme="light"
      >
        <span
          class="css-1f43avz-a11yText-A11yText"
          id="react-select-11-live-region"
        />
        <span
          aria-atomic="false"
          aria-live="polite"
          aria-relevant="additions text"
          class="css-1f43avz-a11yText-A11yText"
        />
        <div
          class="react-select__control react-select__control--menu-is-open css-i2418r"
          data-theme="light"
        >
          <div
            class="react-select__value-container react-select__value-container--has-value css-j93siq"
            data-theme="light"
          >
            <div
              class="basemap-switcher-value react-select__single-value css-1xa1gs2"
              data-theme="light"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                OSM
              </div>
            </div>
            <input
              aria-autocomplete="list"
              aria-controls="react-select-11-listbox"
              aria-expanded="true"
              aria-haspopup="true"
              aria-owns="react-select-11-listbox"
              aria-readonly="true"
              class="css-mohuvp-dummyInput-DummyInput"
              id="react-select-11-input"
              inputmode="none"
              role="combobox"
              tabindex="0"
              value=""
            />
          </div>
          <div
            class="react-select__indicators css-hfbj6y"
            data-theme="light"
          >
            <hr
              aria-orientation="vertical"
              class="chakra-divider react-select__indicator-separator css-1i6c5ox"
              data-theme="light"
            />
            <div
              aria-hidden="true"
              class="react-select__indicator react-select__dropdown-indicator css-xq12md"
              data-theme="light"
            >
              <svg
                aria-hidden="true"
                class="chakra-icon css-onkibi"
                data-theme="light"
                focusable="false"
                role="presentation"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
        </div>
        <div
          class="react-select__menu css-ky7590"
          data-theme="light"
          id="react-select-11-listbox"
        >
          <div
            class="react-select__menu-list css-1h5avke"
            data-theme="light"
            role="listbox"
          >
            <div
              aria-selected="true"
              class="basemap-switcher-option react-select__option react-select__option--is-focused react-select__option--is-selected css-e8c6zu"
              data-focus="true"
              data-theme="light"
              id="react-select-11-option-0"
              role="option"
              tabindex="-1"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                OSM
              </div>
            </div>
            <div
              aria-selected="false"
              class="basemap-switcher-option react-select__option css-e8c6zu"
              data-theme="light"
              id="react-select-11-option-1"
              role="option"
              tabindex="-1"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                TopPlus Open
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    act(() => {
        osmSource.setState("error");
    });

    // switch active layer
    activeBaseLayer = map.layers.getActiveBaseLayer();
    expect(activeBaseLayer?.id).toBe("osm");

    // option disabled, warning icon shown and selected option changed?
    expect(switcherSelect).toMatchInlineSnapshot(`
      <div
        class="basemap-switcher-select react-select--has-value css-79elbk"
        data-theme="light"
      >
        <span
          class="css-1f43avz-a11yText-A11yText"
          id="react-select-11-live-region"
        />
        <span
          aria-atomic="false"
          aria-live="polite"
          aria-relevant="additions text"
          class="css-1f43avz-a11yText-A11yText"
        />
        <div
          class="react-select__control react-select__control--menu-is-open css-i2418r"
          data-theme="light"
        >
          <div
            class="react-select__value-container react-select__value-container--has-value css-j93siq"
            data-theme="light"
          >
            <div
              class="basemap-switcher-value react-select__single-value react-select__single-value--is-disabled css-1xa1gs2"
              data-theme="light"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                OSM
                <div
                  class="css-1v4xcoh"
                  data-theme="light"
                >
                  <span>
                    <svg
                      aria-label="layerNotAvailable"
                      color="red"
                      fill="none"
                      height="1em"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      style="color: red;"
                      viewBox="0 0 24 24"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                      />
                      <line
                        x1="12"
                        x2="12"
                        y1="9"
                        y2="13"
                      />
                      <line
                        x1="12"
                        x2="12.01"
                        y1="17"
                        y2="17"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
            <input
              aria-autocomplete="list"
              aria-controls="react-select-11-listbox"
              aria-expanded="true"
              aria-haspopup="true"
              aria-owns="react-select-11-listbox"
              aria-readonly="true"
              class="css-mohuvp-dummyInput-DummyInput"
              id="react-select-11-input"
              inputmode="none"
              role="combobox"
              tabindex="0"
              value=""
            />
          </div>
          <div
            class="react-select__indicators css-hfbj6y"
            data-theme="light"
          >
            <hr
              aria-orientation="vertical"
              class="chakra-divider react-select__indicator-separator css-1i6c5ox"
              data-theme="light"
            />
            <div
              aria-hidden="true"
              class="react-select__indicator react-select__dropdown-indicator css-xq12md"
              data-theme="light"
            >
              <svg
                aria-hidden="true"
                class="chakra-icon css-onkibi"
                data-theme="light"
                focusable="false"
                role="presentation"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
        </div>
        <div
          class="react-select__menu css-ky7590"
          data-theme="light"
          id="react-select-11-listbox"
        >
          <div
            class="react-select__menu-list css-1h5avke"
            data-theme="light"
            role="listbox"
          >
            <div
              aria-disabled="true"
              aria-selected="true"
              class="basemap-switcher-option react-select__option react-select__option--is-disabled react-select__option--is-focused react-select__option--is-selected css-e8c6zu"
              data-focus="true"
              data-theme="light"
              id="react-select-11-option-0"
              role="option"
              tabindex="-1"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                OSM
                <div
                  class="css-1v4xcoh"
                  data-theme="light"
                >
                  <span>
                    <svg
                      aria-label="layerNotAvailable"
                      color="red"
                      fill="none"
                      height="1em"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      style="color: red;"
                      viewBox="0 0 24 24"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                      />
                      <line
                        x1="12"
                        x2="12"
                        y1="9"
                        y2="13"
                      />
                      <line
                        x1="12"
                        x2="12.01"
                        y1="17"
                        y2="17"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
            <div
              aria-selected="false"
              class="basemap-switcher-option react-select__option css-e8c6zu"
              data-theme="light"
              id="react-select-11-option-1"
              role="option"
              tabindex="-1"
            >
              <div
                class="css-u4p24i"
                data-theme="light"
              >
                TopPlus Open
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
});

it("should update the ui when a layer title changes", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                id: "osm",
                title: "OSM",
                isBaseLayer: true,
                visible: true,
                olLayer: new TileLayer({
                    source: new OSM()
                })
            },
            {
                id: "topplus-open",
                title: "TopPlus Open",
                isBaseLayer: true,
                visible: true,
                olLayer: new TileLayer({
                    source: new BkgTopPlusOpen()
                })
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();

    const activeBaseLayer = map.layers.getActiveBaseLayer();
    expect(activeBaseLayer?.id).toBe("osm");

    showDropdown(switcherSelect);
    expect(switcherSelect).toMatchInlineSnapshot(`
      <div
        class="basemap-switcher-select react-select--has-value css-79elbk"
        data-theme="light"
      >
        <span
          class="css-1f43avz-a11yText-A11yText"
          id="react-select-12-live-region"
        />
        <span
          aria-atomic="false"
          aria-live="polite"
          aria-relevant="additions text"
          class="css-1f43avz-a11yText-A11yText"
        />
        <div
          class="react-select__control react-select__control--menu-is-open css-i2418r"
          data-theme="light"
        >
          <div
            class="react-select__value-container react-select__value-container--has-value css-j93siq"
            data-theme="light"
          >
            <div
              class="react-select__single-value css-1xa1gs2"
              data-theme="light"
            >
              OSM
            </div>
            <input
              aria-autocomplete="list"
              aria-controls="react-select-12-listbox"
              aria-expanded="true"
              aria-haspopup="true"
              aria-owns="react-select-12-listbox"
              aria-readonly="true"
              class="css-mohuvp-dummyInput-DummyInput"
              id="react-select-12-input"
              inputmode="none"
              role="combobox"
              tabindex="0"
              value=""
            />
          </div>
          <div
            class="react-select__indicators css-hfbj6y"
            data-theme="light"
          >
            <hr
              aria-orientation="vertical"
              class="chakra-divider react-select__indicator-separator css-1i6c5ox"
              data-theme="light"
            />
            <div
              aria-hidden="true"
              class="react-select__indicator react-select__dropdown-indicator css-xq12md"
              data-theme="light"
            >
              <svg
                aria-hidden="true"
                class="chakra-icon css-onkibi"
                data-theme="light"
                focusable="false"
                role="presentation"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
        </div>
        <div
          class="react-select__menu css-ky7590"
          data-theme="light"
          id="react-select-12-listbox"
        >
          <div
            class="react-select__menu-list css-1h5avke"
            data-theme="light"
            role="listbox"
          >
            <div
              aria-selected="true"
              class="basemap-switcher-option react-select__option react-select__option--is-focused react-select__option--is-selected css-e8c6zu"
              data-focus="true"
              data-theme="light"
              id="react-select-12-option-0"
              role="option"
              tabindex="-1"
            >
              OSM
            </div>
            <div
              aria-selected="false"
              class="basemap-switcher-option react-select__option css-e8c6zu"
              data-theme="light"
              id="react-select-12-option-1"
              role="option"
              tabindex="-1"
            >
              TopPlus Open
            </div>
          </div>
        </div>
      </div>
    `);

    // change layer title
    act(() => {
        activeBaseLayer?.setTitle("New Layer Title");
    });

    // option disabled, warning icon shown and selected option changed?
    expect(switcherSelect).toMatchInlineSnapshot(`
      <div
        class="basemap-switcher-select react-select--has-value css-79elbk"
        data-theme="light"
      >
        <span
          class="css-1f43avz-a11yText-A11yText"
          id="react-select-12-live-region"
        />
        <span
          aria-atomic="false"
          aria-live="polite"
          aria-relevant="additions text"
          class="css-1f43avz-a11yText-A11yText"
        />
        <div
          class="react-select__control react-select__control--menu-is-open css-i2418r"
          data-theme="light"
        >
          <div
            class="react-select__value-container react-select__value-container--has-value css-j93siq"
            data-theme="light"
          >
            <div
              class="react-select__single-value css-1xa1gs2"
              data-theme="light"
            >
              OSM
            </div>
            <input
              aria-autocomplete="list"
              aria-controls="react-select-12-listbox"
              aria-expanded="true"
              aria-haspopup="true"
              aria-owns="react-select-12-listbox"
              aria-readonly="true"
              class="css-mohuvp-dummyInput-DummyInput"
              id="react-select-12-input"
              inputmode="none"
              role="combobox"
              tabindex="0"
              value=""
            />
          </div>
          <div
            class="react-select__indicators css-hfbj6y"
            data-theme="light"
          >
            <hr
              aria-orientation="vertical"
              class="chakra-divider react-select__indicator-separator css-1i6c5ox"
              data-theme="light"
            />
            <div
              aria-hidden="true"
              class="react-select__indicator react-select__dropdown-indicator css-xq12md"
              data-theme="light"
            >
              <svg
                aria-hidden="true"
                class="chakra-icon css-onkibi"
                data-theme="light"
                focusable="false"
                role="presentation"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
        </div>
        <div
          class="react-select__menu css-ky7590"
          data-theme="light"
          id="react-select-12-listbox"
        >
          <div
            class="react-select__menu-list css-1h5avke"
            data-theme="light"
            role="listbox"
          >
            <div
              aria-selected="true"
              class="basemap-switcher-option react-select__option react-select__option--is-focused react-select__option--is-selected css-e8c6zu"
              data-focus="true"
              data-theme="light"
              id="react-select-12-option-0"
              role="option"
              tabindex="-1"
            >
              New Layer Title
            </div>
            <div
              aria-selected="false"
              class="basemap-switcher-option react-select__option css-e8c6zu"
              data-theme="light"
              id="react-select-12-option-1"
              role="option"
              tabindex="-1"
            >
              TopPlus Open
            </div>
          </div>
        </div>
      </div>
    `);
});

function showDropdown(switcherSelect: HTMLElement) {
    // open dropdown to include options in snapshot; react-select creates list of options in dom after opening selection
    act(() => {
        fireEvent.keyDown(switcherSelect, { key: "ArrowDown" });
    });
}

function getCurrentOptions(switcherSelect: HTMLElement) {
    return Array.from(
        switcherSelect.getElementsByClassName("basemap-switcher-option")
    ) as HTMLElement[];
}

async function waitForBasemapSwitcher() {
    const { switcherDiv, switcherSelect } = await waitFor(async () => {
        const switcherDiv: HTMLDivElement | null =
            await screen.findByTestId<HTMLDivElement>("switcher");
        if (!switcherDiv) {
            throw new Error("basemap switcher not rendered");
        }

        const switcherSelect: HTMLElement | null = switcherDiv.querySelector(
            ".basemap-switcher-select"
        );
        if (!switcherSelect) {
            throw new Error("basemap switcher select not rendered");
        }
        return { switcherDiv, switcherSelect };
    });
    return { switcherDiv, switcherSelect };
}
