// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { MapModel } from "@open-pioneer/map";
import type { Map } from "ol";

export abstract class BaseInteraction<Params, Data> {
    private state: EditingWorkflowState<Data> = { type: "idle" };

    constructor(
        private readonly mapModelInstance: MapModel,
        private readonly parameters: Params
    ) {}

    start(): void {
        if (this.state.type === "idle") {
            const data = this.startInteraction(this.parameters);
            this.state = { type: "active", data };
        }
    }

    stop(): void {
        if (this.state.type === "active") {
            this.stopInteraction(this.state.data);
            this.state = { type: "idle" };
        }
    }

    protected get map(): Map {
        return this.mapModel.olMap;
    }

    protected get mapModel(): MapModel {
        return this.mapModelInstance;
    }

    protected abstract startInteraction(parameters: Params): Data;
    protected abstract stopInteraction(interactionData: Data): void;
}

type EditingWorkflowState<T> = IdleState | ActiveState<T>;

interface IdleState {
    readonly type: "idle";
}

interface ActiveState<T> {
    readonly type: "active";
    readonly data: T;
}
