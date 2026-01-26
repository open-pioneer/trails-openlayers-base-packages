// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { MapModel } from "@open-pioneer/map";
import type { Map } from "ol";

import type { EditingInteraction } from "./EditingInteraction";

export abstract class BaseInteraction<P, D> implements EditingInteraction {
    constructor(
        private readonly mapModelInstance: MapModel,
        private readonly parameters: P
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

    protected abstract startInteraction(parameters: P): D;
    protected abstract stopInteraction(interactionData: D): void;

    private state: EditingWorkflowState<D> = { type: "idle" };
}

type EditingWorkflowState<T> = IdleState | ActiveState<T>;

interface IdleState {
    readonly type: "idle";
}

interface ActiveState<T> {
    readonly type: "active";
    readonly data: T;
}
