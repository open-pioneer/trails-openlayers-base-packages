// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import { DECLARE_SERVICE_INTERFACE, ServiceOptions } from "@open-pioneer/runtime";
import { AbstractLayer } from "./layers/AbstractLayer";
import { LayerConfig } from "./layers/shared/LayerConfig";
import { LayerConstructor } from "./layers/shared/internals";
import { INTERNAL_CONSTRUCTOR_TAG } from "./utils/InternalConstructorTag";
import { Layer } from "./layers/unions";

interface References {
    httpService: HttpService;
}

/**
 * Options that can be passed to {@link LayerFactory.create}.
 *
 * The `type` option is mandatory and indicates the type of the layer (e.g. `WMSLayer`).
 * The other options depend on the specific layer type.
 */
export type LayerCreateOptions<LayerType extends Layer, Config extends LayerConfig> = {
    /** The layer type to construct. */
    type: LayerConstructor<Config, LayerType>;
} & Config;

/**
 * Creates instances of layer classes.
 *
 * Use the interface `"map.LayerFactory"` to obtain an instance of this service.
 */
export class LayerFactory {
    declare [DECLARE_SERVICE_INTERFACE]: "map.LayerFactory";

    #httpService: HttpService;

    constructor(options: ServiceOptions<References>) {
        this.#httpService = options.references.httpService;
    }

    /**
     * Creates a new instance of the given layer type.
     * The `"type"` option is mandatory and specifies which layer type to create.
     *
     * The other configuration options may be dependent on the specific layer type.
     *
     * Example:
     *
     * ```ts
     * import { SimpleLayer } from "@open-pioneer/map";
     *
     * const layerFactory = ...; // injected
     * const layer = layerFactory.create({
     *     type: SimpleLayer,
     *     title: "Layer title",
     *     olLayer: new TileLayer({}),
     *     // ... other options
     * });
     * ```
     */
    create<LayerType extends Layer, Config extends LayerConfig>(
        config: LayerCreateOptions<LayerType, Config>
    ): LayerType {
        const { type, ...rest } = config;
        if (!type || !(type.prototype instanceof AbstractLayer)) {
            throw new Error(
                `Invalid layer type option. Use one of the layer classes exported by this package.`
            );
        }
        return new type(
            rest as unknown as Config,
            { httpService: this.#httpService },
            INTERNAL_CONSTRUCTOR_TAG
        );
    }
}
