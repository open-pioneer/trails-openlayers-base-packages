// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import ImageWMS from "ol/source/ImageWMS";
import { SublayerModel, WMSLayerConfig, WMSLayerModel, WMSSublayerConfig } from "../../api";
import { DeferredExecution, defer } from "../../util/defer";
import { AbstractLayerModel } from "../AbstractLayerModel";
import { AbstractLayerModelBase } from "../AbstractLayerModelBase";
import { MapModelImpl } from "../MapModelImpl";
import { SublayersCollectionImpl } from "../SublayersCollectionImpl";
import ImageLayer from "ol/layer/Image";

const LOG = createLogger("map:WMSLayer");

export class WMSLayerImpl extends AbstractLayerModel implements WMSLayerModel {
    #sublayers: SublayersCollectionImpl<WMSSublayerImpl>;
    #deferredSublayerUpdate: DeferredExecution | undefined;
    #source: ImageWMS;

    // TODO: config signature
    constructor(config: WMSLayerConfig) {
        const source = new ImageWMS({
            ...config.sourceOptions,
            url: config.url,
            params: {
                ...config.sourceOptions?.params
            }
        });
        super({
            ...config,
            layer: new ImageLayer({ source })
        });
        this.#source = source;
        this.#sublayers = new SublayersCollectionImpl(constructSublayers(config.sublayers));
        this.#updateLayersParam();
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
    }

    #getVisibleLayerNames() {
        const layers: string[] = [];
        const visitSublayer = (sublayer: WMSSublayerImpl) => {
            if (!sublayer.visible) {
                return;
            }

            layers.push(sublayer.name);
            for (const nestedSublayer of sublayer.sublayers.__getRawSublayers()) {
                visitSublayer(nestedSublayer);
            }
        };

        for (const sublayer of this.sublayers.__getRawSublayers()) {
            visitSublayer(sublayer);
        }
        return layers;
    }
}

class WMSSublayerImpl extends AbstractLayerModelBase implements SublayerModel {
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
