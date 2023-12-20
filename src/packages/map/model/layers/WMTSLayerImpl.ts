// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger, isAbortError } from "@open-pioneer/core";
import WMTS, { optionsFromCapabilities } from "ol/source/WMTS";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import TileLayer from "ol/layer/Tile";
import type TileSourceType from "ol/source/Tile";
import { AbstractLayer } from "../AbstractLayer";
import { AbstractLayerBase } from "../AbstractLayerBase";
import { MapModelImpl } from "../MapModelImpl";
import { Sublayer, WMTSLayer, WMTSLayerConfig } from "../../api";
import { SublayersCollectionImpl } from "../SublayersCollectionImpl";
import { getLegendUrl, fetchCapabilities } from "../../util/capabilities-utils";

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
        this.#fetchWMTSCapabilities().then(
            (result: string) => {
                const parser = new WMTSCapabilities();
                const capabilities = parser.read(result);

                const options = optionsFromCapabilities(capabilities, {
                    layer: this.#name,
                    matrixSet: this.#matrixSet
                });
                if (!options) {
                    return;
                }
                const source = new WMTS(options);
                this.#source = source;
                this.#layer.setSource(this.#source);
                const activeStyleId = source.getStyle();
                const legendUrl = getLegendUrl(capabilities, this.name, activeStyleId);
                this.#legend = legendUrl;
                this.__emitChangeEvent("changed:legend");
            },
            (error) => {
                if (isAbortError(error)) {
                    LOG.error(`Layer ${this.name} has been destroyed before fetching the data`);
                }
                LOG.error(`Failed fetching WMTS capabilities for Layer ${this.name}`, error);
            }
        );
    }

    get layer() {
        return this.#layer;
    }

    get url() {
        return this.#url;
    }

    get name() {
        return this.#url;
    }

    get matrixSet() {
        return this.#matrixSet;
    }

    get attributions() {
        return this.#attributions;
    }

    get sublayers(): SublayersCollectionImpl<Sublayer & AbstractLayerBase<{}>> | undefined {
        return undefined;
    }

    async #fetchWMTSCapabilities(): Promise<string> {
        return fetchCapabilities(this.#url, this.#abortController.signal);
    }
}
