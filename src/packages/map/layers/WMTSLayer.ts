// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive } from "@conterra/reactivity-core";
import { createLogger, deprecated, isAbortError } from "@open-pioneer/core";
import { ImageTile } from "ol";
import Tile from "ol/Tile";
import TileState from "ol/TileState";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import TileLayer from "ol/layer/Tile";
import type TileSourceType from "ol/source/Tile";
import WMTS, { optionsFromCapabilities, Options as WMTSSourceOptions } from "ol/source/WMTS";
import type { LayerFactory } from "../LayerFactory";
import { MapModel } from "../model/MapModel";
import { InternalConstructorTag } from "../utils/InternalConstructorTag";
import { fetchText } from "../utils/fetch";
import { AbstractLayer } from "./AbstractLayer";
import { LayerConfig } from "./shared/LayerConfig";
import { ATTACH_TO_MAP, GET_DEPS, LayerConstructor, LayerDependencies } from "./shared/internals";
import { getLegendUrl } from "./wmts/getLegendUrl";

/**
 * Configuration options supported by {@link WMTSLayer}.
 *
 * @group Layers
 */
export interface WMTSLayerConfig extends LayerConfig {
    /** URL of the WMTS service. */
    url: string;

    /** The name of the WMTS layer in the service's capabilities. */
    name: string;

    /** The name of the tile matrix set in the service's capabilities. */
    matrixSet: string;

    /**
     * Additional source options for the layer's WMTS source.
     *
     * NOTE: These options are intended for advanced configuration:
     * the WMTS Layer manages some of the OpenLayers source options itself.
     */
    sourceOptions?: Partial<WMTSSourceOptions>;
}

const LOG = createLogger("map:WMTSLayer");

const deprecatedConstructor = deprecated({
    name: "WMTSLayer constructor",
    packageName: "@open-pioneer/map",
    since: "v1.0.0",
    alternative: "use LayerFactory.create() instead"
});

/**
 * Displays an OGC Web Map Tile Service (WMTS).
 *
 * @group Layers
 */
export class WMTSLayer extends AbstractLayer {
    #url: string;
    #name: string;
    #matrixSet: string;
    #layer: TileLayer<TileSourceType>;
    #source: WMTS | undefined;
    #sourceOptions?: Partial<WMTSSourceOptions>;
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

    destroy(): void {
        this.#abortController.abort();
        super.destroy();
    }

    get type() {
        return "wmts" as const;
    }

    /** URL of the WMTS service. */
    override get legend(): string | undefined {
        return this.#legend.value;
    }

    override get sublayers(): undefined {
        return undefined;
    }

    override get layers(): undefined {
        return undefined;
    }

    get url() {
        return this.#url;
    }

    /** The name of the WMTS layer in the service's capabilities. */
    get name() {
        return this.#name;
    }

    /** The name of the tile matrix set in the service's capabilities. */
    get matrixSet() {
        return this.#matrixSet;
    }

    override [ATTACH_TO_MAP](map: MapModel): void {
        super[ATTACH_TO_MAP](map);
        this.#load();
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
                    throw new Error(`Layer '${this.#name}' was not found in capabilities`);
                }
                if (options.matrixSet !== this.#matrixSet) {
                    throw new Error(
                        `Tile matrix set '${this.#matrixSet}' was not found in capabilities`
                    );
                }
                if (this.#sourceOptions?.style && this.#sourceOptions.style !== options.style) {
                    const styleToUse = this.#existsStyleInCapabilities(
                        capabilities,
                        this.#sourceOptions.style
                    );
                    if (!styleToUse) {
                        throw new Error(
                            `Style '${this.#sourceOptions.style}' was not found in capabilities`
                        );
                    }
                    options.style = this.#sourceOptions.style;
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
                const legendUrl = getLegendUrl(capabilities, this.name, activeStyleId);
                this.#legend.value = legendUrl;
            })
            .catch((error) => {
                if (isAbortError(error)) {
                    LOG.debug(`Layer ${this.name} has been destroyed before fetching the data`);
                    return;
                }
                LOG.error(`Failed initialize WMTS for Layer ${this.name}`, error);
                //TODO: how to set the load state to error?
            });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #existsStyleInCapabilities(capabilities: any, styleToUse: string): boolean {
        // NOTE: we have a style override, check if the style exists in the capabilities
        // the helper optionsFromCapabilities, supports style, too, but uses the Title instead of the Identifier, to find a match in the capabilities
        const layerDesc = capabilities.Contents?.Layer?.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (layer: any) => layer.Identifier === this.#name
        );
        return (
            layerDesc?.Style?.some(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (style: any) => style.Identifier === styleToUse
            ) ?? false
        );
    }

    async #fetchWMTSCapabilities(): Promise<string> {
        const httpService = this[GET_DEPS]().httpService;
        return fetchText(this.#url, httpService, this.#abortController.signal);
    }

    async #loadTile(tile: Tile, tileUrl: string): Promise<void> {
        const httpService = this[GET_DEPS]().httpService;
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
    const check: LayerConstructor<WMTSLayerConfig, WMTSLayer> = WMTSLayer;
    void check;
}

function isHtmlImage(htmlElement: HTMLElement | OffscreenCanvas): htmlElement is HTMLImageElement {
    return "tagName" in htmlElement && htmlElement.tagName === "IMG";
}
