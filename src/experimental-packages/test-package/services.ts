// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { HttpServiceImpl } from "@open-pioneer/http/services";
console.log(HttpServiceImpl);

import { Error } from "@open-pioneer/core";
console.log(Error);

import { useServiceInternal } from "@open-pioneer/runtime/react-integration";
console.log(useServiceInternal);

import OlMap from "ol/Map";
console.log(OlMap);

export class SayHello {
    constructor() {
        console.log("Hello from SayHello service!");
    }
}
