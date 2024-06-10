// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Reactive, computed, reactive } from "@conterra/reactivity-core";
import { Demo, createDemos } from "./Demo";
import type { DECLARE_SERVICE_INTERFACE, ServiceOptions } from "@open-pioneer/runtime";

export type DemoInfo = Pick<Demo, "id" | "title">;

export class AppModel {
    declare [DECLARE_SERVICE_INTERFACE]: "app.AppModel";

    #demosById:Map<string, Demo>;
    #currentDemoId: Reactive<string>;
    #currentDemo = computed(() => {
        const currentId = this.#currentDemoId.value;
        const demo = this.#demosById.get(currentId);
        if (!demo) {
            throw new Error(`Demo '${currentId}' does not exist.`);
        }
        return demo;
    });
    #allDemoInfos = computed<DemoInfo[]>(() => {
        return Array.from(this.#demosById.values());
    });

    constructor(serviceOptions: ServiceOptions) {
        const demos = createDemos(serviceOptions.intl);
        this.#demosById = new Map(
            demos.map((demo) => [demo.id, demo])
        );

        if (this.#demosById.size === 0) {
            throw new Error("No demos defined.");
        }
        this.#currentDemoId = reactive(demos[0]!.id);
    }

    get currentDemo(): Demo {
        return this.#currentDemo.value;
    }

    get allDemoInfos(): DemoInfo[] {
        return this.#allDemoInfos.value;
    }

    selectDemo(demoId: string) {
        if (!this.#demosById.has(demoId)) {
            throw new Error(`Demo '${demoId}' does not exist.`);
        }
        this.#currentDemoId.value = demoId;
    }
}
