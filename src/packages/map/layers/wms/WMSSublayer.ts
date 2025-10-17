// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Reactive, reactive } from "@conterra/reactivity-core";
import { MapModel } from "../../model/MapModel";
import { AbstractLayerBase } from "../AbstractLayerBase";
import {
    assertInternalConstructor,
    INTERNAL_CONSTRUCTOR_TAG,
    InternalConstructorTag
} from "../shared/internals";
import { LayerBaseConfig } from "../shared/LayerConfig";
import { SublayerBaseType } from "../shared/SublayerBaseType";
import { SublayersCollection } from "../shared/SublayersCollection";
import { WMSLayer } from "../WMSLayer";

/**
 * Configuration options to construct the sublayers of a {@link WMSLayer}.
 */
export interface WMSSublayerConfig extends LayerBaseConfig {
    /**
     * The name of the WMS sublayer in the service's capabilities.
     * Not mandatory, e.g. for WMS group layer. See [WMS spec](https://www.ogc.org/standard/wms/).
     */
    name?: string;

    /** Configuration for nested sublayers. */
    sublayers?: WMSSublayerConfig[];
}

/**
 * Represents a sublayer of a {@link WMSLayer}.
 */
export class WMSSublayer extends AbstractLayerBase implements SublayerBaseType {
    #parent: WMSSublayer | WMSLayer | undefined;
    #parentLayer: WMSLayer | undefined;
    #name: string | undefined;
    #legend = reactive<string | undefined>();
    #sublayers: SublayersCollection<WMSSublayer>;
    #visible: Reactive<boolean>;

    /**
     * @internal
     */
    constructor(config: WMSSublayerConfig, tag: InternalConstructorTag) {
        assertInternalConstructor(tag);

        super(config);
        this.#name = config.name;
        this.#visible = reactive(config.visible ?? true);
        this.#sublayers = new SublayersCollection(
            constructSublayers(config.sublayers),
            INTERNAL_CONSTRUCTOR_TAG
        );
    }

    override get type() {
        return "wms-sublayer" as const;
    }

    /**
     * The name of the WMS sublayer in the service's capabilities.
     *
     * Is optional as a WMS group layer in a WMS service does not need to have a name.
     */
    get name(): string | undefined {
        return this.#name;
    }

    override get layers(): undefined {
        return undefined;
    }

    override get sublayers(): SublayersCollection<WMSSublayer> {
        return this.#sublayers;
    }

    override get parent(): WMSSublayer | WMSLayer {
        const parent = this.#parent;
        if (!parent) {
            throw new Error(`WMS sublayer ${this.id} has not been attached to its parent yet.`);
        }
        return parent;
    }

    get parentLayer(): WMSLayer {
        const parentLayer = this.#parentLayer;
        if (!parentLayer) {
            throw new Error(`WMS sublayer ${this.id} has not been attached to its parent yet.`);
        }
        return parentLayer;
    }

    override get legend(): string | undefined {
        return this.#legend.value;
    }

    override get visible(): boolean {
        return this.#visible.value;
    }

    /**
     * Called by the parent layer when it is attached to the map to attach all sublayers.
     */
    override __attachToMap(map: MapModel): void {
        super.__attachToMap(map);

        // Recurse into nested sublayers
        for (const sublayer of this.sublayers.__getRawSublayers()) {
            sublayer.__attachToMap(map);
        }
    }

    override __detachFromMap(): void {
        super.__detachFromMap();
        for (const sublayer of this.#sublayers.getSublayers()) {
            sublayer.__detachFromMap();
        }
    }

    /**
     * Attaches this sublayer to its parent _layer_ and its immediate parent _layer or sublayer_.
     */
    __attachToParent(parentLayer: WMSLayer, parent: WMSLayer | WMSSublayer): void {
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
            sublayer.__attachToParent(parentLayer, this);
        }
    }

    /**
     * Called by the parent layer to update the legend on load.
     */
    __setLegend(legendUrl: string | undefined) {
        this.#legend.value = legendUrl;
    }

    override setVisible(newVisibility: boolean): void {
        this.#visible.value = newVisibility;
    }
}

/**
 * Constructs a tree of wms sublayers from a nested configuration object.
 */
export function constructSublayers(sublayerConfigs: WMSSublayerConfig[] = []): WMSSublayer[] {
    const sublayers: WMSSublayer[] = [];
    try {
        for (const sublayerConfig of sublayerConfigs) {
            sublayers.push(new WMSSublayer(sublayerConfig, INTERNAL_CONSTRUCTOR_TAG));
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
