// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive } from "@conterra/reactivity-core";
import { createServiceOptions, LayerConfig, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import TileLayer from "ol/layer/Tile";
import { get, getPointResolution } from "ol/proj";
import { OSM } from "ol/source";
import View from "ol/View";
import { ReactNode } from "react";
import { expect, it } from "vitest";
import { ScaleSetter } from "./ScaleSetter";
import { useReactiveValue } from "@open-pioneer/reactivity";

const defaultBasemapConfig = [
    {
        id: "osm",
        title: "OSM",
        isBaseLayer: true,
        visible: true,
        olLayer: new TileLayer({
            source: new OSM(),
            minZoom: 10
        })
    }
];

it("should successfully create a scale Setter component", async () => {
    const { map, Wrapper } = await setup();

    render(<ScaleSetter map={map} data-testid="scale-setter" />, { wrapper: Wrapper });

    // scale Setter is mounted
    const { setterDiv, setterButton } = await waitForScaleSetter();
    expect(setterDiv).toMatchSnapshot();

    // check scale setter box is available
    expect(setterButton.tagName).toBe("BUTTON");
});

it("should successfully create a scale setter component with additional css classes and box properties", async () => {
    const { map, Wrapper } = await setup();
    render(<ScaleSetter map={map} className="test test1 test2" data-testid="scale-setter" />, {
        wrapper: Wrapper
    });

    // scale setter is mounted
    const { setterDiv } = await waitForScaleSetter();
    expect(setterDiv).toMatchSnapshot();

    // check scale setter box is available
    if (!setterDiv) {
        throw new Error("scale text not rendered");
    }

    expect(setterDiv.tagName).toBe("DIV");
    expect(setterDiv.classList.contains("test")).toBe(true);
    expect(setterDiv.classList.contains("test1")).toBe(true);
    expect(setterDiv.classList.contains("test2")).toBe(true);
    expect(setterDiv.classList.contains("test3")).not.toBe(true);
});

it("should successfully render the scale in the correct locale", async () => {
    const center = [847541, 6793584];
    const resolution = 9.554628535647032;
    const projection = get("EPSG:3857");
    if (!projection) {
        throw new Error("projection not found");
    }

    const { map, changeLocale, Wrapper } = await setup();
    const olMap = map.olMap;
    olMap.setView(
        new View({
            center,
            resolution,
            projection
        })
    );

    changeLocale("en");
    const result = render(<ScaleSetter map={map} data-testid="scale-setter" />, {
        wrapper: Wrapper
    });

    const { setterButton } = await waitForScaleSetter();
    expect(setterButton.textContent).toBe("1 : 21,026");

    changeLocale("de");
    result.rerender(<ScaleSetter map={map} data-testid="scale-setter" />);
    waitFor(() => expect(setterButton.textContent).toBe("1 : 21.026"));
});

it("should successfully update the map scale and label when selection changes", async () => {
    const user = userEvent.setup();
    const { map, Wrapper } = await setup({
        layers: defaultBasemapConfig
    });
    const olMap = map.olMap;

    render(<ScaleSetter map={map} data-testid="scale-setter" />, { wrapper: Wrapper });

    const { setterButton } = await waitForScaleSetter();
    const setterOptions = await getMenuOptions(user, setterButton);
    if (setterOptions[0] == undefined) {
        throw new Error("Expected an option to be available");
    }
    await user.click(setterOptions[0]!);

    const DEFAULT_DPI = 25.4 / 0.28;
    const INCHES_PER_METRE = 39.37;
    const resolution = olMap.getView().getResolution();
    const center = olMap.getView().getCenter();

    expect(resolution).toBeDefined();
    expect(center).toBeDefined();
    const pointResolution = getPointResolution(
        olMap.getView().getProjection(),
        resolution!,
        center!
    );
    const scale = Math.round(pointResolution * INCHES_PER_METRE * DEFAULT_DPI);
    const setterValue = getValueForOption(setterOptions[0]!);
    expect(scale).toBe(setterValue);
});

it("should successfully update the label when map scale changes after creation", async () => {
    const { map, Wrapper, changeLocale } = await setup({
        layers: defaultBasemapConfig
    });
    changeLocale("de");

    const olMap = map.olMap;
    render(<ScaleSetter map={map} data-testid="scale-setter" />, { wrapper: Wrapper });

    const { setterButton } = await waitForScaleSetter();
    if (olMap.getView() == undefined || olMap.getView().getZoom() == undefined) {
        throw new Error("Map view not rendered");
    }

    const initialLabel = setterButton.textContent;
    expect(initialLabel).toBeTruthy();

    olMap.getView().setZoom(olMap.getView().getZoom()! - 1);

    // Wait until the label changes.. There seems to be some instability in this test.
    await waitFor(() => {
        if (setterButton.textContent === initialLabel) {
            throw new Error("Button label did not update");
        }
    });

    const DEFAULT_DPI = 25.4 / 0.28;
    const INCHES_PER_METRE = 39.37;
    const resolution = olMap.getView().getResolution();
    const center = olMap.getView().getCenter();

    expect(resolution).toBeDefined();
    expect(center).toBeDefined();
    const pointResolution = getPointResolution(
        olMap.getView().getProjection(),
        resolution!,
        center!
    );
    const scale = Math.round(pointResolution * INCHES_PER_METRE * DEFAULT_DPI);
    expect(setterButton.textContent).toBe("1 : " + scale.toLocaleString("de"));
});

it("should use default scales when nothing is set", async () => {
    const user = userEvent.setup();
    const { map, Wrapper } = await setup({
        layers: defaultBasemapConfig
    });
    render(<ScaleSetter map={map} data-testid="scale-setter" />, { wrapper: Wrapper });

    const { setterButton } = await waitForScaleSetter();
    const setterOptions = await getMenuOptions(user, setterButton);
    const setterOptionValues = await getOptionValues(setterOptions);

    const advScale = [
        17471320, 8735660, 4367830, 2183915, 1091957, 545978, 272989, 136494, 68247, 34123, 17061,
        8530, 4265, 2132
    ];

    expect(setterOptionValues).toStrictEqual(advScale);
});

it("should use given scales when something is set", async () => {
    const user = userEvent.setup();
    const scales = [10000, 9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000, 500, 10];
    const { map, Wrapper } = await setup({
        layers: defaultBasemapConfig
    });
    render(<ScaleSetter map={map} scales={scales} data-testid="scale-setter" />, {
        wrapper: Wrapper
    });

    const { setterButton } = await waitForScaleSetter();
    const setterOptions = await getMenuOptions(user, setterButton);
    const setterOptionValues = await getOptionValues(setterOptions);

    expect(setterOptionValues).toStrictEqual(scales);
});

async function waitForScaleSetter() {
    const { setterDiv, setterButton } = await waitFor(async () => {
        const setterDiv = await screen.findByTestId("scale-setter");
        const setterButton = setterDiv.querySelector("button"); // find first HTMLParagraphElement (scale select) in scale setter component
        if (!setterButton) {
            throw new Error("scale select Button not rendered");
        }

        return { setterDiv, setterButton };
    });

    return { setterDiv, setterButton };
}

async function getMenuOptions(
    user: UserEvent,
    setterButton: HTMLButtonElement
): Promise<HTMLDivElement[]> {
    //options are mounted lazily after dropdown is opened
    await user.click(setterButton);

    const menu = await waitFor(() => {
        const menu = document.body.querySelector(
            "div.scale-setter-menuoptions"
        ) as HTMLDivElement | null;
        if (!menu) {
            throw new Error("Menu node not found");
        }
        return menu;
    });

    const items = await waitFor(async () => {
        const items = Array.from(menu.querySelectorAll(".scale-setter-option")) as HTMLDivElement[];
        if (!items.length) {
            throw new Error("Menu does not have any options");
        }
        return items;
    });
    return items;
}

async function setup(opts?: { layers?: LayerConfig[] }) {
    const { map, registry } = await setupMap({ layers: opts?.layers });
    const injectedServices = createServiceOptions({ registry });
    const locale = reactive<string>();
    const Wrapper = (props: { children?: ReactNode }) => {
        const currentLocale = useReactiveValue(locale);
        return (
            <PackageContextProvider services={injectedServices} locale={currentLocale}>
                {props.children}
            </PackageContextProvider>
        );
    };

    function changeLocale(newLocale: string) {
        locale.value = newLocale;
    }

    return { map, changeLocale, Wrapper };
}

function getOptionValues(setterOptions: HTMLDivElement[]) {
    const optionValues: number[] = [];
    setterOptions.forEach((option) => {
        const setterValue = getValueForOption(option);
        optionValues.push(setterValue);
    });
    return optionValues;
}

function getValueForOption(setterOption: HTMLDivElement): number {
    const valueStr = setterOption.getAttribute("data-value"); //chakra's data-value attribute stores raw value of scale denominator
    const value = valueStr ? parseInt(valueStr) : Number.NaN;

    return value;
}
