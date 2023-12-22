// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger, isAbortError } from "@open-pioneer/core";
import { ImageWrapper } from "ol";
import WMSCapabilities from "ol/format/WMSCapabilities";
import ImageLayer from "ol/layer/Image";
import type ImageSource from "ol/source/Image";
import ImageWMS from "ol/source/ImageWMS";
import { WMSLayer, WMSLayerConfig, WMSSublayer, WMSSublayerConfig } from "../../api";
import { fetchCapabilities } from "../../util/capabilities-utils";
import { DeferredExecution, defer } from "../../util/defer";
import { AbstractLayer } from "../AbstractLayer";
import { AbstractLayerBase } from "../AbstractLayerBase";
import { MapModelImpl } from "../MapModelImpl";
import { SublayersCollectionImpl } from "../SublayersCollectionImpl";

const LOG = createLogger("map:WMSLayer");

export class WMSLayerImpl extends AbstractLayer implements WMSLayer {
    #url: string;
    #sublayers: SublayersCollectionImpl<WMSSublayerImpl>;
    #deferredSublayerUpdate: DeferredExecution | undefined;
    #layer: ImageLayer<ImageSource>;
    #source: ImageWMS;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #capabilities: Record<string, any> | undefined;
    readonly #abortController = new AbortController();

    constructor(config: WMSLayerConfig) {
        const layer = new ImageLayer();
        super({
            ...config,
            olLayer: layer
        });
        const source = new ImageWMS({
            ...config.sourceOptions,
            url: config.url,
            params: {
                ...config.sourceOptions?.params
            },
            // Use http service to load tiles; needed for authentication etc.
            imageLoadFunction: (wrapper, url) => {
                return this.#loadImage(wrapper, url).catch((error) => {
                    LOG.error(`Failed to load tile at '${url}'`, error);
                });
            }
        });
        this.#url = config.url;
        this.#source = source;
        this.#layer = layer;
        this.#sublayers = new SublayersCollectionImpl(constructSublayers(config.sublayers));
        this.#updateLayersParam();
    }

    get legend() {
        return undefined;
    }

    get url(): string {
        return this.#url;
    }
    get __source() {
        return this.#source;
    }

    get sublayers(): SublayersCollectionImpl<WMSSublayerImpl> {
        return this.#sublayers;
    }

    __attach(map: MapModelImpl): void {
        super.__attach(map);
        for (const sublayer of this.#sublayers.getSublayers()) {
            sublayer.__attach(map, this, this);
        }
        const layers: WMSSublayerImpl[] = [];
        const getNestedSublayer = (sublayers: WMSSublayerImpl[], layers: WMSSublayerImpl[]) => {
            for (const sublayer of sublayers) {
                const nested = sublayer.sublayers.getSublayers();
                if (nested.length) {
                    getNestedSublayer(nested, layers);
                } else {
                    if (sublayer.name) {
                        layers.push(sublayer);
                    }
                }
            }
        };
        this.#fetchWMSCapabilities()
            .then((result: string) => {
                const parser = new WMSCapabilities();
                const capabilities = parser.read(result);
                this.#capabilities = capabilities;
                getNestedSublayer(this.#sublayers.getSublayers(), layers);
                for (const layer of layers) {
                    const legendUrl = getLegendUrl(capabilities, layer.name!);
                    console.log(legendUrl, layer.name);
                    layer.legend = legendUrl;
                }
            })
            .catch((error) => {
                if (isAbortError(error)) {
                    LOG.error(`Layer ${this.id} has been destroyed before fetching the data`);
                    return;
                }
                LOG.error(`Failed fetching WMTS capabilities for Layer ${this.id}`, error);
            });
    }

    /** Called by the sublayers when their visibility changed. */
    __updateSublayerVisibility() {
        if (this.#deferredSublayerUpdate?.reschedule()) {
            return;
        }
        this.#deferredSublayerUpdate = defer(() => {
            try {
                this.#updateLayersParam();
                this.#deferredSublayerUpdate = undefined;
            } catch (e) {
                LOG.error(`Failed to update sublayer visibility on WMS layer '${this.id}'.`, e);
            }
        });
    }

    /**
     * Gathers the visibility of _all_ sublayers and assembles the 'layers' WMS parameter.
     * The parameters are then applied to the WMS source.
     */
    #updateLayersParam() {
        const layers = this.#getVisibleLayerNames();
        this.#source.updateParams({
            "LAYERS": layers
        });

        // only set source if there are visible sublayers, otherwise
        // we send an invalid http request
        const source = layers.length === 0 ? null : this.#source;
        if (this.#layer.getSource() !== source) {
            this.#layer.setSource(source);
        }
    }

    #getVisibleLayerNames() {
        const layers: string[] = [];
        const visitSublayer = (sublayer: WMSSublayerImpl) => {
            if (!sublayer.visible) {
                return;
            }

            const nestedSublayers = sublayer.sublayers.__getRawSublayers();
            if (nestedSublayers.length) {
                for (const nestedSublayer of nestedSublayers) {
                    visitSublayer(nestedSublayer);
                }
            } else {
                /**
                 * Push sublayer only, if layer name is not an empty string | undefined | ...
                 */
                if (sublayer.name) {
                    layers.push(sublayer.name);
                }
            }
        };

        for (const sublayer of this.sublayers.__getRawSublayers()) {
            visitSublayer(sublayer);
        }
        return layers;
    }

    async #fetchWMSCapabilities(): Promise<string> {
        const httpService = this.map.__sharedDependencies.httpService;
        const url = `${this.#url}?LANGUAGE=ger&SERVICE=WMS&REQUEST=GetCapabilities`;
        return fetchCapabilities(url, httpService, this.#abortController.signal);
    }

    async #loadImage(imageWrapper: ImageWrapper, imageUrl: string): Promise<void> {
        const httpService = this.map.__sharedDependencies.httpService;
        const image = imageWrapper.getImage() as HTMLImageElement;

        const response = await httpService.fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}.`);
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
    }
}

class WMSSublayerImpl extends AbstractLayerBase implements WMSSublayer {
    #parent: WMSSublayerImpl | WMSLayerImpl | undefined;
    #parentLayer: WMSLayerImpl | undefined;
    #name: string | undefined;
    #legend: string | undefined;
    #sublayers: SublayersCollectionImpl<WMSSublayerImpl>;
    #visible: boolean;

    constructor(config: WMSSublayerConfig) {
        super(config);
        this.#name = config.name;
        this.#visible = config.visible ?? true;
        this.#sublayers = new SublayersCollectionImpl(constructSublayers(config.sublayers));
    }

    get name(): string | undefined {
        return this.#name;
    }

    get sublayers(): SublayersCollectionImpl<WMSSublayerImpl> {
        return this.#sublayers;
    }

    get parent(): WMSSublayerImpl | WMSLayerImpl {
        const parent = this.#parent;
        if (!parent) {
            throw new Error(`WMS sublayer ${this.id} has not been attached to its parent yet.`);
        }
        return parent;
    }

    get parentLayer(): WMSLayerImpl {
        const parentLayer = this.#parentLayer;
        if (!parentLayer) {
            throw new Error(`WMS sublayer ${this.id} has not been attached to its parent yet.`);
        }
        return parentLayer;
    }
    get legend(): string | undefined {
        return this.#legend;
    }

    set legend(legendUrl: string | undefined) {
        this.#legend = legendUrl;
        this.__emitChangeEvent("changed:legend");
    }

    /**
     * Called by the parent layer when it is attached to the map to attach all sublayers.
     */
    __attach(
        map: MapModelImpl,
        parentLayer: WMSLayerImpl,
        parent: WMSLayerImpl | WMSSublayerImpl
    ): void {
        super.__attachToMap(map);
        if (this.#parent) {
            throw new Error(
                `WMS sublayer '${this.id}' has already been attached to parent '${this.#parent.id}'`
            );
        }
        this.#parent = parent;
        if (this.#parentLayer) {
            throw new Error(
                `WMS sublayer '${this.id}' has already been attached to parent layer '${this.#parentLayer.id}'`
            );
        }
        this.#parentLayer = parentLayer;

        // Recurse into nested sublayers
        for (const sublayer of this.sublayers.__getRawSublayers()) {
            sublayer.__attach(map, parentLayer, this);
        }
    }

    get visible(): boolean {
        return this.#visible;
    }

    setVisible(newVisibility: boolean): void {
        if (this.visible !== newVisibility) {
            this.#visible = newVisibility;
            this.#parentLayer?.__updateSublayerVisibility();
            this.__emitChangeEvent("changed:visible");
        }
    }
}

function constructSublayers(sublayerConfigs: WMSSublayerConfig[] = []): WMSSublayerImpl[] {
    const sublayers: WMSSublayerImpl[] = [];
    try {
        for (const sublayerConfig of sublayerConfigs) {
            sublayers.push(new WMSSublayerImpl(sublayerConfig));
        }
        return sublayers;
    } catch (e) {
        // Ensure previous sublayers are destroyed if a single constructor throws
        while (sublayers.length) {
            const layer = sublayers.pop()!;
            layer?.destroy();
        }
        throw new Error("Failed to construct sublayers.", { cause: e });
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLegendUrl(capabilities: Record<string, any>, activeLayerId: string) {
    const content = capabilities?.Capability;
    const layer = content?.Layer;
    let url: string | undefined = undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchNestedLayer = (layer: Record<string, any>[]) => {
        for (const currentLayer of layer) {
            // spec. if, a layer has a <Name>, then it is a map layer
            if (currentLayer?.Name === activeLayerId) {
                const activeLayer = currentLayer;
                const styles = activeLayer.Style;
                if (!styles) {
                    LOG.debug("No style in WMS layer capabilities - giving up.");
                    return;
                }
                const activeStyle = styles?.[0];
                url = activeStyle.LegendURL?.[0]?.OnlineResource;
            } else if (currentLayer.Layer) {
                searchNestedLayer(currentLayer.Layer);
            }
        }
    };
    if (layer) {
        searchNestedLayer(layer.Layer);
    }
    return url;
}
