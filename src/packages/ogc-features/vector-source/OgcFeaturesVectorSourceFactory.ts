// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import { ServiceOptions } from "@open-pioneer/runtime";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import VectorSource from "ol/source/Vector";
import {
    OgcFeatureVectorSourceOptions,
    OgcFeaturesVectorSourceFactory as ServiceInterface
} from "../api";
import { OgcFeaturesVectorSource } from "./OgcFeaturesVectorSource";

interface References {
    httpService: HttpService;
}

export class OgcFeaturesVectorSourceFactory implements ServiceInterface {
    #httpService: HttpService;

    constructor({ references }: ServiceOptions<References>) {
        this.#httpService = references.httpService;
    }

    createVectorSource(options: OgcFeatureVectorSourceOptions): VectorSource<Feature<Geometry>> {
        return new OgcFeaturesVectorSource(options, this.#httpService);
    }
}
