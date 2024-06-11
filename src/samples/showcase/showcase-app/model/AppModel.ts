// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModel } from "@open-pioneer/map";
import { Demo } from "./Demo";
import { DemoInfo } from "./AppInitModel";
import { Reactive, computed, reactive, batch } from "@conterra/reactivity-core";

export class AppModel {
    readonly mapModel: MapModel;

    #demosById: Map<string, Demo>;
    #currentDemo: Reactive<Demo>;
    #allDemoInfos = computed<DemoInfo[]>(() => {
        return Array.from(this.#demosById.values());
    });

    constructor(mapModel: MapModel, demos: Demo[]) {
        this.mapModel = mapModel;

        this.#demosById = new Map(demos.map((demo) => [demo.id, demo]));

        if (this.#demosById.size === 0) {
            throw new Error("No demos defined.");
        }
        this.#currentDemo = reactive(demos[0]!);
        this.#currentDemo.value.activate?.();
    }

    destroy(): void {
        this.#currentDemo.value.deactivate?.();
    }

    get currentDemo(): Demo {
        return this.#currentDemo.value;
    }

    get allDemoInfos(): DemoInfo[] {
        return this.#allDemoInfos.value;
    }

    selectDemo(demoId: string) {
        const newDemo = this.#demosById.get(demoId);
        if (!newDemo) {
            throw new Error(`Demo '${demoId}' does not exist.`);
        }

        batch(() => {
            const oldDemo = this.#currentDemo.value;
            oldDemo.deactivate?.();

            this.#currentDemo.value = newDemo;
            newDemo.activate?.();
        });
    }
}
