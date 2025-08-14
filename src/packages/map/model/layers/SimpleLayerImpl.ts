// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SimpleLayer, SimpleLayerConfig } from "../../api";
import { AbstractLayer } from "../AbstractLayer";
import { InternalConstructorTag, LayerConstructor, LayerDependencies } from "./internals";

// Import for api docs
// eslint-disable-next-line unused-imports/no-unused-imports
import type { LayerFactory } from "./LayerFactory";

/**
 * A simple layer that accepts a custom OpenLayer's layer instance.
 *
 * Some API features (such as sublayers) will not be available.
 */
export class SimpleLayerImpl extends AbstractLayer implements SimpleLayer {
    /**
     * @deprecated Prefer using {@link LayerFactory.create} instead of calling the constructor directly
     */
    constructor(config: SimpleLayerConfig);

    /**
     * NOTE: Do not use this overload. Use {@link LayerFactory.create} instead.
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
        super(config, deps, internalTag);
    }

    get type() {
        return "simple" as const;
    }

    get legend(): undefined {
        return undefined;
    }

    get layers(): undefined {
        return undefined;
    }

    get sublayers(): undefined {
        return undefined;
    }
}

// Ensure layer class is assignable to the constructor interface (there is no "implements" for the class itself).
// eslint-disable-next-line no-constant-condition
if (false) {
    const check: LayerConstructor<SimpleLayerConfig, SimpleLayer> = SimpleLayerImpl;
    void check;
}
