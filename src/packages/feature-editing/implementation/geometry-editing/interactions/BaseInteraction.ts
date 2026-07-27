// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { MapModel } from "@open-pioneer/map";
import type { Map } from "ol";

type EditingWorkflowState<T> = IdleState | ActiveState<T>;

interface IdleState {
    readonly type: "idle";
}

interface ActiveState<T> {
    readonly type: "active";
    readonly data: T;
}

export abstract class BaseInteraction<Params, Data> {
    #state: EditingWorkflowState<Data> = { type: "idle" };

    readonly #mapModelInstance: MapModel;
    readonly #parameters: Params;

    constructor(mapModelInstance: MapModel, parameters: Params) {
        this.#mapModelInstance = mapModelInstance;
        this.#parameters = parameters;
    }

    start(): void {
        if (this.#state.type === "idle") {
            const data = this.startInteraction(this.#parameters);
            this.#state = { type: "active", data };
        }
    }

    stop(): void {
        if (this.#state.type === "active") {
            this.stopInteraction(this.#state.data);
            this.#state = { type: "idle" };
        }
    }

    protected get map(): Map {
        return this.mapModel.olMap;
    }

    protected get mapModel(): MapModel {
        return this.#mapModelInstance;
    }

    protected abstract startInteraction(parameters: Params): Data;
    protected abstract stopInteraction(interactionData: Data): void;
}
