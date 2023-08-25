// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapRegistry } from "@open-pioneer/map";
import { ServiceOptions } from "@open-pioneer/runtime";

export class MapSpy {
    private mapRegistry: MapRegistry;

    constructor({ references }: ServiceOptions<{ registry: MapRegistry }>) {
        this.mapRegistry = references.registry;
        this.test().catch((e) => {
            console.error(`Failed to inspect map state`, e);
        });
    }

    async test() {
        const mapModel = await this.mapRegistry.expectMapModel("test");

        console.log("map model", mapModel);
        console.log("initial extent (1)", mapModel.initialExtent);
        console.log("map container (1)", mapModel.container);

        await mapModel.whenDisplayed();
        console.log("initial extent (2)", mapModel.initialExtent);
        console.log("map container (2)", mapModel.container);
    }
}
