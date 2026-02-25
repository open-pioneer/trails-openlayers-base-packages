// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import { ServiceOptions } from "@open-pioneer/runtime";
import { SearchSource } from "@open-pioneer/search";
import {
    OgcFeatureSearchSourceOptions,
    OgcFeaturesSearchSourceFactory as ServiceInterface
} from "../api";
import { OgcFeatureSearchSource } from "./OgcFeatureSearchSource";

interface References {
    httpService: HttpService;
}

export class OgcFeatureSearchSourceFactory implements ServiceInterface {
    #httpService: HttpService;

    constructor({ references }: ServiceOptions<References>) {
        this.#httpService = references.httpService;
    }

    createSearchSource(options: OgcFeatureSearchSourceOptions): SearchSource {
        return new OgcFeatureSearchSource(options, this.#httpService);
    }
}
