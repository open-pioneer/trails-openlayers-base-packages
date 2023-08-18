// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { OlMapConfigurationProvider } from "@open-pioneer/experimental-ol-map";
import { OlMapRegistry } from "@open-pioneer/experimental-ol-map/services";
import { Service, ServiceOptions } from "@open-pioneer/runtime";
import {
    PackageContextProvider,
    PackageContextProviderProps
} from "@open-pioneer/test-utils/react";
import { createService } from "@open-pioneer/test-utils/services";
import { render, screen, waitFor, renderHook } from "@testing-library/react";
import { MapOptions } from "ol/Map";
import { expect, it } from "vitest";
import { CoordinateViewer, useFormatting } from "./CoordinateViewer";

class MapConfigProvider implements OlMapConfigurationProvider {
    mapId = "default";
    mapOptions: MapOptions = {};

    constructor(options: ServiceOptions) {
        if (options.properties.mapOptions) {
            this.mapOptions = options.properties.mapOptions as MapOptions;
        }
        if (options.properties.mapId) {
            this.mapId = options.properties.mapId as string;
        }
    }

    getMapOptions(): Promise<MapOptions> {
        return Promise.resolve(this.mapOptions);
    }
}

async function createOlMapRegistry(mapId: string, mapOptions: MapOptions) {
    const mapConfigProvider = await createService(MapConfigProvider, {
        properties: {
            mapOptions: mapOptions,
            mapId
        }
    });
    return await createService(OlMapRegistry, {
        references: {
            providers: [mapConfigProvider]
        }
    });
}

function createPackageContextProviderProps(
    service: Service<OlMapRegistry>
): PackageContextProviderProps {
    return {
        services: {
            "ol-map.MapRegistry": service
        }
    };
}

it("should successfully create a coordinate viewer component", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <CoordinateViewer mapId={mapId}></CoordinateViewer>
            </div>
        </PackageContextProvider>
    );

    // assert map and scale viewer is mounted
    const div = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const coordinateViewerText = domElement.querySelector("p"); // find first HTMLParagraphElement (coordinate viewer text) in scale viewer component
        if (!coordinateViewerText) {
            throw new Error("coordinate viewer text not rendered");
        }
        return domElement;
    });
    expect(div).toMatchSnapshot();

    // check scale viewer box is available
    const box = container.querySelector(".coordinate-viewer");
    expect(box).toBeInstanceOf(HTMLDivElement);
});

it("should successfully create a coordinate viewer component with additional css classes and box properties", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <CoordinateViewer
                    mapId={mapId}
                    className="test test1 test2"
                    pl="1px"
                ></CoordinateViewer>
            </div>
        </PackageContextProvider>
    );

    // assert map and scale viewer is mounted
    const div = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const coordinateViewerText = domElement.querySelector("p"); // find first HTMLParagraphElement (coordinate viewer text) in scale viewer component
        if (!coordinateViewerText) {
            throw new Error("coordinate viewer text not rendered");
        }
        return domElement;
    });
    expect(div).toMatchSnapshot();

    // check scale viewer box is available
    const box = container.querySelector(".coordinate-viewer");
    if (!box) {
        throw new Error("coordinate viewer not rendered");
    } else {
        expect(box).toBeInstanceOf(HTMLDivElement);
        expect(box.classList.contains("test")).toBe(true);
        expect(box.classList.contains("test1")).toBe(true);
        expect(box.classList.contains("test2")).toBe(true);
        expect(box.classList.contains("test3")).not.toBe(true);

        const styles = window.getComputedStyle(box);
        expect(styles.paddingLeft).toBe("1px");
    }
});

it("should format coordinates to correct coordinate string for the corresponding locale", async () => {
    const coords = [3545.08081, 4543543.009];

    const optionsEN = { locale: "en" };
    const hook = renderHook(() => useFormatting(coords, 2), {
        wrapper: (props) => <PackageContextProvider {...props} {...optionsEN} />
    });
    const stringCoordinates = hook.result.current;
    expect(stringCoordinates).equals("3,545.08 4,543,543.01");

    const optionsDE = { locale: "de" };
    const hookDE = renderHook(() => useFormatting(coords, 3), {
        wrapper: (props) => <PackageContextProvider {...props} {...optionsDE} />
    });
    expect(hookDE.result.current).equals("3.545,081 4.543.543,009");
});

it("should format coordinates to correct coordinate string with default precision", async () => {
    const coords = [3545.08081, 4543543.009];
    const optionsDE = { locale: "de" };

    const hookDeWithoutPrecision = renderHook(() => useFormatting(coords, undefined), {
        wrapper: (props) => <PackageContextProvider {...props} {...optionsDE} />
    });
    expect(hookDeWithoutPrecision.result.current).equals("3.545,0808 4.543.543,0090");
});
