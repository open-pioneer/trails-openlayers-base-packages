// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import ImageLayer from "ol/layer/Image";
import type ImageSource from "ol/source/Image";
import ImageWMS from "ol/source/ImageWMS";
import { Sublayer, WMSLayerConfig, WMSLayer, WMSSublayerConfig } from "../../api";
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
            }
        });
        this.#url = config.url;
        this.#source = source;
        this.#layer = layer;
        this.#sublayers = new SublayersCollectionImpl(constructSublayers(config.sublayers));
        this.#updateLayersParam();
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
                layers.push(sublayer.name);
            }
        };

        for (const sublayer of this.sublayers.__getRawSublayers()) {
            visitSublayer(sublayer);
        }
        return layers;
    }
}

class WMSSublayerImpl extends AbstractLayerBase implements Sublayer {
    #parent: WMSSublayerImpl | WMSLayerImpl | undefined;
    #parentLayer: WMSLayerImpl | undefined;
    #name: string;
    #sublayers: SublayersCollectionImpl<WMSSublayerImpl>;
    #visible: boolean;

    constructor(config: WMSSublayerConfig) {
        super(config);
        this.#name = config.name;
        this.#visible = config.visible ?? true;
        this.#sublayers = new SublayersCollectionImpl(constructSublayers(config.sublayers));
    }

    get name(): string {
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
    getLegend(): string | undefined {
        //TODO async
        const olMap = this.map.olMap;
        const res = olMap.getView().getResolution();
        return this.#parentLayer?.__source.getLegendUrl(res, { LAYER: this.name });
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
                `WMS sublayer '${this.id}' has already been attached to parent layer '${
                    this.#parentLayer.id
                }'`
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
