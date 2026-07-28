// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { ReadonlyReactive } from "@conterra/reactivity-core";
import { type PackageIntl, ServiceOptions } from "@open-pioneer/runtime";
import {
    VectorLayerSelectionSource,
    VectorLayerSelectionSourceFactory,
    VectorLayerSelectionSourceOptions
} from "./api";
import { VectorLayerSelectionSourceImpl } from "./sources/VectorSelectionSource";

export class VectorSelectionSourceFactory implements VectorLayerSelectionSourceFactory {
    #currentIntl: ReadonlyReactive<PackageIntl>;

    constructor({ currentIntl }: ServiceOptions<PackageIntl>) {
        this.#currentIntl = currentIntl;
    }
    createSelectionSource(options: VectorLayerSelectionSourceOptions): VectorLayerSelectionSource {
        return new VectorLayerSelectionSourceImpl(
            options.id,
            options.vectorLayer,
            options.label,
            this.#currentIntl
        );
    }
}
