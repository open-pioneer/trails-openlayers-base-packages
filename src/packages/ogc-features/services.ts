// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import VectorSource from "ol/source/Vector";
import {
    OgcFeatureSearchSourceOptions,
    OgcFeatureVectorSourceOptions,
    OgcFeaturesSearchSourceFactory,
    OgcFeaturesVectorSourceFactory
} from "./api";
import { SearchSource } from "@open-pioneer/search";
import { createVectorSource } from "./createVectorSource";
import { OgcFeatureSearchSource } from "./OgcFeatureSearchSource";
import { HttpService } from "@open-pioneer/http";
import { ServiceOptions } from "@open-pioneer/runtime";

// Both services share the same dependencies for now
interface References {
    httpService: HttpService;
}

export class VectorSourceFactory implements OgcFeaturesVectorSourceFactory {
    #httpService: HttpService;

    constructor({ references }: ServiceOptions<References>) {
        this.#httpService = references.httpService;
    }

    createVectorSource(options: OgcFeatureVectorSourceOptions): VectorSource<Feature<Geometry>> {
        return createVectorSource(options, this.#httpService);
    }
}

export class SearchSourceFactory implements OgcFeaturesSearchSourceFactory {
    #httpService: HttpService;

    constructor({ references }: ServiceOptions<References>) {
        this.#httpService = references.httpService;
    }

    createSearchSource(options: OgcFeatureSearchSourceOptions): SearchSource {
        return new OgcFeatureSearchSource(options, this.#httpService);
    }
}
