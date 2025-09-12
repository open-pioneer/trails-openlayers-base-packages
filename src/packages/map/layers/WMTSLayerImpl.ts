// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive } from "@conterra/reactivity-core";
import { createLogger, deprecated, isAbortError } from "@open-pioneer/core";
import { ImageTile } from "ol";
import Tile from "ol/Tile";
import TileState from "ol/TileState";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import TileLayer from "ol/layer/Tile";
import type { Options as WMSSourceOptions } from "ol/source/ImageWMS";
import type TileSourceType from "ol/source/Tile";
import WMTS, { optionsFromCapabilities } from "ol/source/WMTS";
import { MapModelImpl } from "../model/MapModelImpl";
import { fetchText } from "../utils/fetch";
import { AbstractLayer } from "./AbstractLayer";
import { WMTSLayer, WMTSLayerConfig } from "./WMTSLayer";
import { InternalConstructorTag, LayerConstructor, LayerDependencies } from "./internals";

// Import for api docs
// eslint-disable-next-line unused-imports/no-unused-imports
import type { LayerFactory } from "../LayerFactory";

const LOG = createLogger("map:WMTSLayer");

const deprecatedConstructor = deprecated({
    name: "WMTSLayer constructor",
    packageName: "@open-pioneer/map",
    since: "v1.0.0",
    alternative: "use LayerFactory.create() instead"
});

export class WMTSLayerImpl extends AbstractLayer implements WMTSLayer {
    #url: string;
    #name: string;
    #matrixSet: string;
    #layer: TileLayer<TileSourceType>;
    #source: WMTS | undefined;
    #sourceOptions?: Partial<WMSSourceOptions>;
    #legend = reactive<string | undefined>();

    #loadStarted = false;
    readonly #abortController = new AbortController();

    /**
     * @deprecated Prefer using {@link LayerFactory.create} instead of calling the constructor directly
     */
    constructor(config: WMTSLayerConfig);

    /**
     * NOTE: Do not use this overload. Use {@link LayerFactory.create} instead.
     *
     * @internal
     */
    constructor(
        config: WMTSLayerConfig,
        deps: LayerDependencies,
        internalTag: InternalConstructorTag
    );

    constructor(
        config: WMTSLayerConfig,
        deps?: LayerDependencies,
        internalTag?: InternalConstructorTag
    ) {
        if (!internalTag) {
            deprecatedConstructor();
        }

        const layer = new TileLayer();
        super(
            {
                ...config,
                olLayer: layer
            },
            deps,
            internalTag
        );
        this.#url = config.url;
        this.#name = config.name;
        this.#layer = layer;
        this.#matrixSet = config.matrixSet;
        this.#sourceOptions = config.sourceOptions;
    }

    get type() {
        return "wmts" as const;
    }

    destroy(): void {
        this.#abortController.abort();
        super.destroy();
    }

    get legend(): string | undefined {
        return this.#legend.value;
    }

    get sublayers(): undefined {
        return undefined;
    }

    get layers(): undefined {
        return undefined;
    }

    __attachToMap(map: MapModelImpl): void {
        super.__attachToMap(map);
        this.#load();
    }

    get url() {
        return this.#url;
    }

    get name() {
        return this.#name;
    }

    get matrixSet() {
        return this.#matrixSet;
    }

    #load() {
        if (this.#loadStarted) {
            return;
        }
        this.#loadStarted = true;
        this.#fetchWMTSCapabilities()
            .then((result: string) => {
                const parser = new WMTSCapabilities();
                const capabilities = parser.read(result);
                const options = optionsFromCapabilities(capabilities, {
                    layer: this.#name,
                    matrixSet: this.#matrixSet
                });
                if (!options) {
                    throw new Error("Layer was not found in capabilities");
                }
                const source = new WMTS({
                    ...options,
                    ...this.#sourceOptions,
                    tileLoadFunction: (tile, tileUrl) => {
                        this.#loadTile(tile, tileUrl);
                    }
                });
                this.#source = source;
                this.#layer.setSource(this.#source);
                const activeStyleId = source.getStyle();
                const legendUrl = getWMTSLegendUrl(capabilities, this.name, activeStyleId);
                this.#legend.value = legendUrl;
            })
            .catch((error) => {
                if (isAbortError(error)) {
                    LOG.debug(`Layer ${this.name} has been destroyed before fetching the data`);
                    return;
                }
                LOG.error(`Failed fetching WMTS capabilities for Layer ${this.name}`, error);
            });
    }

    async #fetchWMTSCapabilities(): Promise<string> {
        const httpService = this.__getDeps().httpService;
        return fetchText(this.#url, httpService, this.#abortController.signal);
    }

    async #loadTile(tile: Tile, tileUrl: string): Promise<void> {
        const httpService = this.__getDeps().httpService;
        try {
            if (!(tile instanceof ImageTile)) {
                throw new Error("Only 'ImageTile' is supported for now.");
            }

            const image = tile.getImage();
            if (!isHtmlImage(image)) {
                // Could also be canvas or video
                throw new Error("Only <img> tags are supported as tiles for now.");
            }

            const response = await httpService.fetch(tileUrl);
            if (!response.ok) {
                throw new Error(`Tile request failed with status ${response.status}.`);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const finish = () => {
                // Cleanup object URL after load to prevent memory leaks.
                // https://stackoverflow.com/questions/62473876/openlayers-6-settileloadfunction-documented-example-uses-url-createobjecturld
                URL.revokeObjectURL(objectUrl);
                image.removeEventListener("load", finish);
                image.removeEventListener("error", finish);
            };
            image.addEventListener("load", finish);
            image.addEventListener("error", finish);
            image.src = objectUrl;
        } catch (e) {
            tile.setState(TileState.ERROR);
            if (!isAbortError(e)) {
                LOG.error("Failed to load tile", e);
            }
        }
    }
}

// Ensure layer class is assignable to the constructor interface (there is no "implements" for the class itself).
// eslint-disable-next-line no-constant-condition
if (false) {
    const check: LayerConstructor<WMTSLayerConfig, WMTSLayer> = WMTSLayerImpl;
    void check;
}

function isHtmlImage(htmlElement: HTMLElement): htmlElement is HTMLImageElement {
    return htmlElement.tagName === "IMG";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getWMTSLegendUrl(
    capabilities: Record<string, any>,
    activeLayerId: string | undefined,
    activeStyleId: string | undefined
): string | undefined {
    const content = capabilities?.Contents;
    const layers = content?.Layer;

    let activeLayer = layers?.find((layer: any) => layer?.Identifier === activeLayerId);
    if (!activeLayer) {
        LOG.debug("Failed to find the active layer in WMTS layer capabilities.");
        activeLayer = layers?.[0];
        if (!activeLayer) {
            LOG.debug("No layer in WMTS capabilities - giving up.");
            return undefined;
        }
    }

    const styles = activeLayer.Style;
    let activeStyle = styles?.find((style: any) => style?.Identifier === activeStyleId);
    if (!activeStyle) {
        LOG.debug("Failed to find active style in WMTS layer.");
        activeStyle = styles?.[0];
        if (!activeStyle) {
            LOG.debug("No style in WMTS layer capabilities - giving up.");
            return undefined;
        }
    }

    const legendUrl = activeStyle.LegendURL?.[0]?.href;
    return legendUrl as string | undefined;
}
