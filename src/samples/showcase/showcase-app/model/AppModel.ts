// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Reactive, batch, computed, reactive, watch } from "@conterra/reactivity-core";
import { Resource, createLogger } from "@open-pioneer/core";
import { MapModel } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import { PackageIntl } from "@open-pioneer/runtime";
import { DemoInfo } from "./AppInitModel";
import { Demo, DemoModel } from "../demos/Demo";

const LOG = createLogger("app::AppModel");

export class AppModel {
    #mapModel: MapModel;
    #notifier: NotificationService;
    #intl: PackageIntl;

    #demosById: Map<string, Demo>;
    #currentDemo: Reactive<[Demo, DemoModel]>;
    #allDemoInfos = computed<DemoInfo[]>(() => {
        return Array.from(this.#demosById.values());
    });
    #resources: Resource[] = [];

    constructor(
        mapModel: MapModel,
        notifier: NotificationService,
        intl: PackageIntl,
        demos: Demo[]
    ) {
        this.#mapModel = mapModel;
        this.#notifier = notifier;
        this.#intl = intl;

        this.#demosById = new Map(demos.map((demo) => [demo.id, demo]));
        if (this.#demosById.size === 0) {
            throw new Error("No demos defined.");
        }

        const demo = demos[0]!;
        this.#currentDemo = reactive([demo, demo.createModel()]);

        this.#applyStateFromUrl();
        this.#resources.push(this.#syncStateToUrl());
    }

    destroy(): void {
        this.#currentDemo.value[1].destroy?.();
    }

    get currentDemo(): Demo {
        return this.#currentDemo.value[0];
    }

    get currentDemoModel(): DemoModel {
        return this.#currentDemo.value[1];
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
            const [, oldDemoModel] = this.#currentDemo.value;
            oldDemoModel.destroy?.();

            this.#currentDemo.value = [newDemo, newDemo.createModel()];
        });
    }

    #applyStateFromUrl(): void {
        const url = new URL(window.location.href);
        const demoId = url.searchParams.get("demo");
        if (!demoId) {
            return;
        }

        if (!this.#demosById.has(demoId)) {
            this.#notifier.notify({
                title: this.#intl.formatMessage({ id: "demoSelection.notFound" }, { demoId })
            });
            return;
        }

        try {
            this.selectDemo(demoId);
        } catch (e) {
            LOG.error("Failed to select demo from URL", e);
        }
    }

    #syncStateToUrl(): Resource {
        return watch(
            () => [this.#currentDemo.value[0].id],
            ([demoId]) => {
                const url = new URL(window.location.href);
                url.searchParams.set("demo", demoId);
                window.history.replaceState(null, "", url.toString());
            },
            { immediate: true }
        );
    }
}
