// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive } from "@conterra/reactivity-core";
import { Demo, createDemos } from "../demos/Demo";
import type {
    DECLARE_SERVICE_INTERFACE,
    PackageIntl,
    Service,
    ServiceOptions
} from "@open-pioneer/runtime";
import { MapRegistry } from "@open-pioneer/map";
import { HttpService } from "@open-pioneer/http";
import { Resource } from "@open-pioneer/core";
import { MAP_ID } from "../MapConfigProviderImpl";
import { AppModel } from "./AppModel";
import { NotificationService } from "@open-pioneer/notifier";
import { VectorSelectionSourceFactory } from "@open-pioneer/selection/services";

export type DemoInfo = Pick<Demo, "id" | "title">;

export interface References {
    httpService: HttpService;
    mapRegistry: MapRegistry;
    notifier: NotificationService;
    vectorSelectionSourceFactory: VectorSelectionSourceFactory;
}

export type AppState = AppStateLoading | AppStateError | AppStateReady;

export interface AppStateLoading {
    readonly kind: "loading";
}

export interface AppStateError {
    readonly kind: "error";
    readonly message: string;
}

export interface AppStateReady {
    readonly kind: "ready";
    readonly appModel: AppModel;
    destroy: () => void;
}

export class AppInitModel implements Service {
    declare [DECLARE_SERVICE_INTERFACE]: "app.AppInitModel";

    #appState = reactive<AppState>({ kind: "loading" });
    #resources: Resource[] = [];
    #isDestroyed = false;

    constructor(serviceOptions: ServiceOptions<References>) {
        const { mapRegistry, httpService, notifier, vectorSelectionSourceFactory } =
            serviceOptions.references;
        const intl = serviceOptions.intl;

        this.#init({
            mapRegistry,
            httpService,
            notifier,
            vectorSelectionSourceFactory,
            intl
        }).catch((err) => {
            this.#appState.value = {
                kind: "error",
                message: (err as Error).message || "Unknown error"
            };
        });
    }

    destroy() {
        this.#isDestroyed = true;
        for (const r of this.#resources) {
            r.destroy();
        }
    }

    get appState(): AppState {
        return this.#appState.value;
    }

    async #init(options: {
        mapRegistry: MapRegistry;
        httpService: HttpService;
        notifier: NotificationService;
        vectorSelectionSourceFactory: VectorSelectionSourceFactory;
        intl: PackageIntl;
    }) {
        const { mapRegistry, httpService, notifier, vectorSelectionSourceFactory, intl } = options;
        const mapModel = await mapRegistry.getMapModel(MAP_ID);

        if (!mapModel) {
            throw new Error("No mapModel found.");
        }

        const demos = createDemos({ intl, httpService, mapModel, vectorSelectionSourceFactory });
        const state: AppStateReady = {
            kind: "ready",
            appModel: new AppModel(mapModel, notifier, intl, demos),
            destroy() {
                this.appModel.destroy();
            }
        };

        if (this.#isDestroyed) {
            state.destroy();
            return;
        }

        this.#appState.value = state;
        this.#resources.push(state);
    }
}
