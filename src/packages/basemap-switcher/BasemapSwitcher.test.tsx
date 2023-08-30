// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { MapContainer } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { BasemapSwitcher } from "./BasemapSwitcher";
import { createPackageContextProviderProps, setupMap, waitForMapMount } from "./test-utils";
import ResizeObserver from "resize-observer-polyfill";

// used to avoid a "ResizeObserver is not defined" error
global.ResizeObserver = ResizeObserver;

const noneBasemap = {
    id: "noBasemap",
    label: "kein Hintergrund",
    selected: false
};
it("should successfully create a basemap switcher component", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <BasemapSwitcher mapId={mapId} noneBasemap={noneBasemap}></BasemapSwitcher>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    // basemap switcher is mounted
    const { switcherDiv } = await waitForBasemapSwitcher();
    expect(switcherDiv).toMatchInlineSnapshot(`
      <div
        class="basemap-switcher css-0"
        data-theme="light"
      >
        <div
          class="css-1bejyq4"
          data-theme="light"
        >
          <b
            class="chakra-text css-0"
            data-theme="light"
          />
          <div
            class="chakra-select__wrapper css-42b2qy"
            data-theme="light"
          >
            <select
              class="chakra-select basemap-switcher-select css-161pkch"
              data-theme="light"
            >
              <option
                value="OSM"
              >
                OSM
              </option>
              <option
                value="kein Hintergrund"
              >
                kein Hintergrund
              </option>
            </select>
            <div
              class="chakra-select__icon-wrapper css-iohxn1"
              data-theme="light"
            >
              <svg
                aria-hidden="true"
                class="chakra-select__icon"
                focusable="false"
                role="presentation"
                style="width: 1em; height: 1em; color: currentColor;"
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
      </div>
    `);

    // check basemap switcher box is available
    expect(switcherDiv).toBeInstanceOf(HTMLDivElement);
});

it("should successfully create a basemap switcher component with additional css classes and box properties", async () => {
    const { mapId, registry } = await setupMap();
    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <BasemapSwitcher
                    mapId={mapId}
                    className="test"
                    pl="1px"
                    noneBasemap={noneBasemap}
                ></BasemapSwitcher>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    // basemap switcher is mounted
    const { switcherDiv } = await waitForBasemapSwitcher();
    expect(switcherDiv).toMatchInlineSnapshot(`
      <div
        class="basemap-switcher test css-sz63p1"
        data-theme="light"
      >
        <div
          class="css-1bejyq4"
          data-theme="light"
        >
          <b
            class="chakra-text css-0"
            data-theme="light"
          />
          <div
            class="chakra-select__wrapper css-42b2qy"
            data-theme="light"
          >
            <select
              class="chakra-select basemap-switcher-select css-161pkch"
              data-theme="light"
            >
              <option
                value="OSM"
              >
                OSM
              </option>
              <option
                value="kein Hintergrund"
              >
                kein Hintergrund
              </option>
            </select>
            <div
              class="chakra-select__icon-wrapper css-iohxn1"
              data-theme="light"
            >
              <svg
                aria-hidden="true"
                class="chakra-select__icon"
                focusable="false"
                role="presentation"
                style="width: 1em; height: 1em; color: currentColor;"
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
      </div>
    `);

    expect(switcherDiv).toBeInstanceOf(HTMLDivElement);
    expect(switcherDiv.classList.contains("test")).toBe(true);
    expect(switcherDiv.classList.contains("foo")).toBe(false);

    const styles = window.getComputedStyle(switcherDiv);
    expect(styles.paddingLeft).toBe("1px");
});

async function waitForBasemapSwitcher() {
    const { domElement, switcherDiv } = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const switcherDiv = domElement.querySelector(".basemap-switcher"); // find first HTMLDivElement in basemap switcher component
        if (!switcherDiv) {
            throw new Error("basemap switcher not rendered");
        }

        const select = switcherDiv.querySelector("select");
        if (!select) {
            throw new Error("basemap switcher select not rendered");
        }
        return { domElement, switcherDiv };
    });
    return { domElement, switcherDiv };
}
