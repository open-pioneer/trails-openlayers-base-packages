// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { type PackageIntl, ServiceOptions } from "@open-pioneer/runtime";
import { VectorLayerSelectionSourceImpl } from "./VectorSelectionSource";
import {
    VectorLayerSelectionSource,
    VectorLayerSelectionSourceFactory,
    VectorLayerSelectionSourceOptions
} from "./api";

export class VectorSelectionSourceFactory implements VectorLayerSelectionSourceFactory {
    #intl: PackageIntl;

    constructor({ intl }: ServiceOptions<PackageIntl>) {
        this.#intl = intl;
    }
    createSelectionSource(options: VectorLayerSelectionSourceOptions): VectorLayerSelectionSource {
        return new VectorLayerSelectionSourceImpl(
            options.vectorLayer,
            options.label,
            this.#intl.formatMessage({ id: "layerNotVisibleReason" })
        );
    }
}
