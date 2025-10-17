// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { deprecated } from "@open-pioneer/core";
import type OlBaseLayer from "ol/layer/Base";
import { AbstractLayer } from "./AbstractLayer";
import { LayerConfig } from "./shared/LayerConfig";
import { InternalConstructorTag, LayerConstructor, LayerDependencies } from "./shared/internals";

// Import for api docs
// eslint-disable-next-line unused-imports/no-unused-imports
import type { LayerFactory } from "../LayerFactory";

/**
 * Options to construct a simple layer.
 *
 * Simple layers are wrappers around a custom OpenLayers layer.
 */
export interface SimpleLayerConfig extends LayerConfig {
    /**
     * The raw OpenLayers instance.
     */
    olLayer: OlBaseLayer;
}

const deprecatedConstructor = deprecated({
    name: "SimpleLayer constructor",
    packageName: "@open-pioneer/map",
    since: "v1.0.0",
    alternative: "use LayerFactory.create() instead"
});

/**
 * A simple layer that accepts a custom OpenLayers layer instance.
 *
 * Any kind of open layers can be made to work with the map package using this class.
 * Some API features (such as sublayers) may not be available.
 */
export class SimpleLayer extends AbstractLayer {
    /**
     * @deprecated Prefer using {@link LayerFactory.create} instead of calling the constructor directly
     */
    constructor(config: SimpleLayerConfig);

    /**
     * NOTE: Do not use this overload. Use {@link LayerFactory.create} instead.
     *
     * @internal
     */
    constructor(
        config: SimpleLayerConfig,
        deps: LayerDependencies,
        internalTag: InternalConstructorTag
    );
    constructor(
        config: SimpleLayerConfig,
        deps?: LayerDependencies,
        internalTag?: InternalConstructorTag
    ) {
        if (!internalTag) {
            deprecatedConstructor();
        }
        super(config, deps, internalTag);
    }

    override get type() {
        return "simple" as const;
    }

    override get legend(): undefined {
        return undefined;
    }

    override get layers(): undefined {
        return undefined;
    }

    override get sublayers(): undefined {
        return undefined;
    }
}

// Ensure layer class is assignable to the constructor interface (there is no "implements" for the class itself).
// eslint-disable-next-line no-constant-condition
if (false) {
    const check: LayerConstructor<SimpleLayerConfig, SimpleLayer> = SimpleLayer;
    void check;
}
