// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger, isAbortError } from "@open-pioneer/core";
import Tile from "ol/Tile";
import TileState from "ol/TileState";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import TileLayer from "ol/layer/Tile";
import type TileSourceType from "ol/source/Tile";
import WMTS, { optionsFromCapabilities } from "ol/source/WMTS";
import { WMTSLayer, WMTSLayerConfig } from "../../api";
import { fetchCapabilities, getLegendUrl } from "../../util/capabilities-utils";
import { AbstractLayer } from "../AbstractLayer";
import { MapModelImpl } from "../MapModelImpl";
import { ImageTile } from "ol";

const LOG = createLogger("map:WMTSLayer");

export class WMTSLayerImpl extends AbstractLayer implements WMTSLayer {
    #url: string;
    #name: string;
    #matrixSet: string;
    #attributions?: string | undefined;
    #layer: TileLayer<TileSourceType>;
    #source: WMTS | undefined;
    #legend: string | undefined;
    readonly #abortController = new AbortController();

    constructor(config: WMTSLayerConfig) {
        const layer = new TileLayer();
        super({
            ...config,
            olLayer: layer
        });
        this.#url = config.url;
        this.#name = config.name;
        this.#layer = layer;
        this.#matrixSet = config.matrixSet;
    }

    destroy(): void {
        super.destroy();
        this.#abortController.abort();
    }

    get legend(): string | undefined {
        return this.#legend;
    }

    __attach(map: MapModelImpl): void {
        super.__attach(map);
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
                    tileLoadFunction: (tile, tileUrl) => {
                        this.#loadTile(tile, tileUrl);
                    }
                });
                this.#source = source;
                this.#layer.setSource(this.#source);
                const activeStyleId = source.getStyle();
                const legendUrl = getLegendUrl(capabilities, this.name, activeStyleId);
                this.#legend = legendUrl;
                this.__emitChangeEvent("changed:legend");
            })
            .catch((error) => {
                if (isAbortError(error)) {
                    LOG.error(`Layer ${this.name} has been destroyed before fetching the data`);
                    return;
                }
                LOG.error(`Failed fetching WMTS capabilities for Layer ${this.name}`, error);
            });
    }

    get layer() {
        return this.#layer;
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

    get attributions() {
        return this.#attributions;
    }

    get sublayers(): undefined {
        return undefined;
    }

    async #fetchWMTSCapabilities(): Promise<string> {
        const httpService = this.map.__sharedDependencies.httpService;
        return fetchCapabilities(this.#url, httpService, this.#abortController.signal);
    }

    async #loadTile(tile: Tile, tileUrl: string): Promise<void> {
        const httpService = this.map.__sharedDependencies.httpService;
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

function isHtmlImage(htmlElement: HTMLElement): htmlElement is HTMLImageElement {
    return htmlElement.tagName === "IMG";
}
