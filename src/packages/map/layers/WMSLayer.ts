// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { batch, computed, ReadonlyReactive, watch } from "@conterra/reactivity-core";
import {
    createLogger,
    deprecated,
    destroyResource,
    isAbortError,
    Resource
} from "@open-pioneer/core";
import { ImageWrapper } from "ol";
import WMSCapabilities from "ol/format/WMSCapabilities";
import ImageLayer from "ol/layer/Image";
import type ImageSource from "ol/source/Image";
import type { Options as WMSSourceOptions } from "ol/source/ImageWMS";
import ImageWMS from "ol/source/ImageWMS";
import { sourceId } from "open-pioneer:source-info";
import type { LayerFactory } from "../LayerFactory";
import { MapModel } from "../model/MapModel";
import { fetchText } from "../utils/fetch";
import { INTERNAL_CONSTRUCTOR_TAG, InternalConstructorTag } from "../utils/InternalConstructorTag";
import { AbstractLayer } from "./AbstractLayer";
import {
    ATTACH_TO_MAP,
    ATTACH_TO_PARENT,
    DETACH_FROM_MAP,
    GET_DEPS,
    GET_RAW_SUBLAYERS,
    LayerConstructor,
    LayerDependencies,
    SET_LEGEND
} from "./shared/internals";
import { LayerConfig } from "./shared/LayerConfig";
import { SublayersCollection } from "./shared/SublayersCollection";
import { getLegendUrl } from "./wms/getLegendUrl";
import { constructSublayers, WMSSublayer, WMSSublayerConfig } from "./wms/WMSSublayer";

/**
 * Configuration options to construct a {@link WMSLayer}.
 *
 * @group Layers
 */
export interface WMSLayerConfig extends LayerConfig {
    /** URL of the WMS service. */
    url: string;

    /** Configures the layer's sublayers. */
    sublayers?: WMSSublayerConfig[];

    /**
     * Additional source options for the layer's WMS source.
     *
     * NOTE: These options are intended for advanced configuration:
     * the WMS Layer manages some of the OpenLayers source options itself.
     */
    sourceOptions?: Partial<WMSSourceOptions>;

    /**
     * Whether to automatically fetch capabilities from the service when needed (default: `true`).
     *
     * Setting this to `false` can be useful as a performance optimization when capabilities are not really required by the application.
     * Note that this will disable some features of the WMS layer: for example, the legend URL will not be available.
     */
    fetchCapabilities?: boolean;
}

const LOG = createLogger(sourceId);

const deprecatedConstructor = deprecated({
    name: "WMSLayer constructor",
    packageName: "@open-pioneer/map",
    since: "v1.0.0",
    alternative: "use LayerFactory.create() instead"
});

/**
 * Displays an OGC Web Map Service (WMS).
 *
 * @group Layers
 */
export class WMSLayer extends AbstractLayer {
    #url: string;
    #sublayers: SublayersCollection<WMSSublayer>;
    #layer: ImageLayer<ImageSource>;
    #source: ImageWMS;
    #fetchCapabilities: boolean;

    #loadStarted = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #capabilities: Record<string, any> | undefined;
    readonly #abortController = new AbortController();

    #visibleSublayers: ReadonlyReactive<string[]>;
    #sublayersWatch: Resource | undefined;

    /**
     * @deprecated Prefer using {@link LayerFactory.create} instead of calling the constructor directly
     */
    constructor(config: WMSLayerConfig);

    /**
     * NOTE: Do not use this overload. Use {@link LayerFactory.create} instead.
     *
     * @internal
     */
    constructor(
        config: WMSLayerConfig,
        deps: LayerDependencies,
        internalTag: InternalConstructorTag
    );
    constructor(
        config: WMSLayerConfig,
        deps?: LayerDependencies,
        internalTag?: InternalConstructorTag
    ) {
        if (!internalTag) {
            deprecatedConstructor();
        }

        const layer = new ImageLayer();

        super(
            {
                ...config,
                olLayer: layer
            },
            deps,
            internalTag
        );

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
        this.#fetchCapabilities = config.fetchCapabilities ?? true;
        this.#source = source;
        this.#layer = layer;

        this.#sublayers = new SublayersCollection(
            constructSublayers(config.sublayers),
            INTERNAL_CONSTRUCTOR_TAG
        );
        this.#sublayers
            [GET_RAW_SUBLAYERS]()
            .forEach((sublayer) => sublayer[ATTACH_TO_PARENT](this, this));

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

    override destroy() {
        this.#abortController.abort();
        this.#sublayersWatch = destroyResource(this.#sublayersWatch);
        super.destroy();
    }

    get type() {
        return "wms" as const;
    }

    get legend() {
        return undefined;
    }

    /** The URL of the WMS service that was used during layer construction. */
    get url(): string {
        return this.#url;
    }

    get layers(): undefined {
        return undefined;
    }

    /**
     * Holds the sublayers of this layer.
     */
    get sublayers(): SublayersCollection<WMSSublayer> {
        return this.#sublayers;
    }

    get capabilities() {
        return this.#capabilities;
    }

    /** @internal */
    [ATTACH_TO_MAP](map: MapModel): void {
        super[ATTACH_TO_MAP](map);
        for (const sublayer of this.#sublayers.getSublayers()) {
            sublayer[ATTACH_TO_MAP](map);
        }

        this.#load();
    }

    /** @internal */
    [DETACH_FROM_MAP](): void {
        super[DETACH_FROM_MAP]();
        for (const sublayer of this.#sublayers.getSublayers()) {
            sublayer[DETACH_FROM_MAP]();
        }
    }

    #load() {
        if (this.#loadStarted || !this.#fetchCapabilities) {
            return;
        }
        this.#loadStarted = true;

        /** Find all leaf nodes representing a layer in the structure */
        const getNestedSublayer = (sublayers: WMSSublayer[], layers: WMSSublayer[]) => {
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

                    const layers: WMSSublayer[] = [];
                    getNestedSublayer(this.#sublayers.getSublayers(), layers);

                    for (const layer of layers) {
                        if (layer.name) {
                            const legendUrl = getLegendUrl(capabilities, layer.name);
                            layer[SET_LEGEND](legendUrl);
                        }
                    }
                });
            })
            .catch((error) => {
                if (isAbortError(error)) {
                    LOG.debug(`Layer '${this.id}' has been destroyed before fetching capabilities`);
                    return;
                }
                LOG.error(`Failed to fetch WMS capabilities for layer '${this.id}'`, error);
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
        const visitSublayer = (sublayer: WMSSublayer) => {
            if (!sublayer.visible) {
                return;
            }

            const nestedSublayers = sublayer.sublayers[GET_RAW_SUBLAYERS]();
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

        for (const sublayer of this.sublayers[GET_RAW_SUBLAYERS]()) {
            visitSublayer(sublayer);
        }
        return layers;
    }

    async #fetchWMSCapabilities(): Promise<string> {
        const httpService = this[GET_DEPS]().httpService;
        const url = `${this.#url}?LANGUAGE=ger&SERVICE=WMS&REQUEST=GetCapabilities`;
        return fetchText(url, httpService, this.#abortController.signal);
    }

    async #loadImage(imageWrapper: ImageWrapper, imageUrl: string): Promise<void> {
        const httpService = this[GET_DEPS]().httpService;
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

// Ensure layer class is assignable to the constructor interface (there is no "implements" for the class itself).
// eslint-disable-next-line no-constant-condition
if (false) {
    const check: LayerConstructor<WMSLayerConfig, WMSLayer> = WMSLayer;
    void check;
}
