// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive, ReadonlyReactive } from "@conterra/reactivity-core";
import { createLogger, Resource } from "@open-pioneer/core";
import { EditingService } from "@open-pioneer/editing";
import { HttpService } from "@open-pioneer/http";
import { MapRegistry } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import {
    DECLARE_SERVICE_INTERFACE,
    PackageIntl,
    Service,
    ServiceOptions
} from "@open-pioneer/runtime";
import { VectorSelectionSourceFactory } from "@open-pioneer/selection/services";
import { sourceId } from "open-pioneer:source-info";
import { createDemos } from "../demos/Demo";
import { MAP_ID } from "../MapConfigProviderImpl";
import { AppModel } from "./AppModel";

const LOG = createLogger(sourceId);

export interface DemoInfo {
    id: string;
    title: string;
}

export interface References {
    httpService: HttpService;
    mapRegistry: MapRegistry;
    notifier: NotificationService;
    vectorSelectionSourceFactory: VectorSelectionSourceFactory;
    editingService: EditingService;
    notificationService: NotificationService;
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
        const {
            mapRegistry,
            httpService,
            notifier,
            vectorSelectionSourceFactory,
            editingService,
            notificationService
        } = serviceOptions.references;
        const currentIntl = serviceOptions.currentIntl;

        this.#init({
            mapRegistry,
            httpService,
            notifier,
            vectorSelectionSourceFactory,
            editingService,
            currentIntl,
            notificationService
        }).catch((err) => {
            LOG.error("Failed to initialize application", err);

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
        editingService: EditingService;
        currentIntl: ReadonlyReactive<PackageIntl>;
        notificationService: NotificationService;
    }) {
        const {
            mapRegistry,
            httpService,
            notifier,
            vectorSelectionSourceFactory,
            editingService,
            currentIntl,
            notificationService
        } = options;
        const mapModel = await mapRegistry.getMapModel(MAP_ID);

        if (!mapModel) {
            throw new Error("No mapModel found.");
        }

        const demos = createDemos({
            currentIntl,
            httpService,
            mapModel,
            vectorSelectionSourceFactory,
            editingService,
            notificationService
        });
        const appModel = new AppModel(mapModel, notifier, currentIntl, demos);

        const state: AppStateReady = {
            kind: "ready",
            appModel,
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
