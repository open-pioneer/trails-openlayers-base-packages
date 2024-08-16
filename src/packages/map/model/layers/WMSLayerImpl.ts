// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    batch,
    computed,
    Reactive,
    reactive,
    ReadonlyReactive,
    watch
} from "@conterra/reactivity-core";
import { createLogger, destroyResource, isAbortError, Resource } from "@open-pioneer/core";
import { ImageWrapper } from "ol";
import WMSCapabilities from "ol/format/WMSCapabilities";
import ImageLayer from "ol/layer/Image";
import type ImageSource from "ol/source/Image";
import ImageWMS from "ol/source/ImageWMS";
import { WMSLayer, WMSLayerConfig, WMSSublayer, WMSSublayerConfig } from "../../api";
import { fetchCapabilities } from "../../util/capabilities-utils";
import { AbstractLayer } from "../AbstractLayer";
import { AbstractLayerBase } from "../AbstractLayerBase";
import { MapModelImpl } from "../MapModelImpl";
import { SublayersCollectionImpl } from "../SublayersCollectionImpl";

const LOG = createLogger("map:WMSLayer");

export class WMSLayerImpl extends AbstractLayer implements WMSLayer {
    #url: string;
    #sublayers: SublayersCollectionImpl<WMSSublayerImpl>;
    #layer: ImageLayer<ImageSource>;
    #source: ImageWMS;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #capabilities: Record<string, any> | undefined;
    readonly #abortController = new AbortController();

    #visibleSublayers: ReadonlyReactive<string[]>;
    #sublayersWatch: Resource | undefined;

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
        this.#visibleSublayers = computed(() => this.#getVisibleLayerNames(), {
            equal(a, b) {
                return a.length === b.length && a.every((v, i) => v === b[i]);
            }
        });

        this.#sublayersWatch = watch(
            () => [this.#visibleSublayers.value],
            ([layers]) => {
                this.#updateLayersParam(layers);
            },
            {
                immediate: true
            }
        );
    }

    destroy() {
        this.#abortController.abort();
        this.#sublayersWatch = destroyResource(this.#sublayersWatch);
        super.destroy();
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

    get capabilities() {
        return this.#capabilities;
    }

    __attach(map: MapModelImpl): void {
        super.__attach(map);
        for (const sublayer of this.#sublayers.getSublayers()) {
            sublayer.__attach(map, this, this);
        }

        /** Find all leaf nodes representing a layer in the structure */
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
                batch(() => {
                    const parser = new WMSCapabilities();
                    const capabilities = parser.read(result);
                    this.#capabilities = capabilities;

                    const layers: WMSSublayerImpl[] = [];
                    getNestedSublayer(this.#sublayers.getSublayers(), layers);

                    for (const layer of layers) {
                        const legendUrl = getWMSLegendUrl(capabilities, layer.name!);
                        layer.__setLegend(legendUrl);
                    }
                });
            })
            .catch((error) => {
                if (isAbortError(error)) {
                    LOG.debug(`Layer ${this.id} has been destroyed before fetching capabilities`);
                    return;
                }
                LOG.error(`Failed to fetch WMS capabilities for layer ${this.id}`, error);
            });
    }

    /**
     * Gathers the visibility of _all_ sublayers and assembles the 'layers' WMS parameter.
     * The parameters are then applied to the WMS source.
     */
    #updateLayersParam(layers: string[]) {
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
    #legend = reactive<string | undefined>();
    #sublayers: SublayersCollectionImpl<WMSSublayerImpl>;
    #visible: Reactive<boolean>;

    constructor(config: WMSSublayerConfig) {
        super(config);
        this.#name = config.name;
        this.#visible = reactive(config.visible ?? true);
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
        return this.#legend.value;
    }

    get visible(): boolean {
        return this.#visible.value;
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

    /**
     * Called by the parent layer to update the legend on load.
     */
    __setLegend(legendUrl: string | undefined) {
        this.#legend.value = legendUrl;
    }

    setVisible(newVisibility: boolean): void {
        this.#visible.value = newVisibility;
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

/** extract the legend url from the service capabilities */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getWMSLegendUrl(capabilities: Record<string, any>, layerName: string) {
    const capabilitiesContent = capabilities?.Capability;
    const rootLayerCapabilities = capabilitiesContent?.Layer;
    let url: string | undefined = undefined;

    /** Recurse search for the currrent layer within the parsed capabilities service*/
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchNestedLayer = (layer: Record<string, any>[]) => {
        for (const currentLayer of layer) {
            // spec. if, a layer has a <Name>, then it is a map layer
            if (currentLayer?.Name === layerName) {
                const activeLayer = currentLayer;
                const styles = activeLayer.Style;
                if (!styles || !styles.length) {
                    LOG.debug("No style in WMS layer capabilities - giving up.");
                    return;
                }
                // by parsing of the service capabilities, every child inherits the parent's legend
                // theorfore, extract the legendURL from the first style object in the array (its own legend)
                const activeStyle = styles[0];
                url = activeStyle.LegendURL?.[0]?.OnlineResource;
            } else if (currentLayer.Layer) {
                searchNestedLayer(currentLayer.Layer);
            }
        }
    };
    if (rootLayerCapabilities) {
        searchNestedLayer(rootLayerCapabilities.Layer);
    }
    return url;
}
