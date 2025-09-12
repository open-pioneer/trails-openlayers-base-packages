// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import { DECLARE_SERVICE_INTERFACE, ServiceOptions } from "@open-pioneer/runtime";
import { AbstractLayer } from "./layers/AbstractLayer";
import { Layer, LayerConfig } from "./layers/base";
import { INTERNAL_CONSTRUCTOR_TAG, LayerConstructor } from "./layers/internals";

interface References {
    httpService: HttpService;
}

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
        config: {
            /** The layer type to construct. */
            type: LayerConstructor<Config, LayerType>;
        } & Config
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
