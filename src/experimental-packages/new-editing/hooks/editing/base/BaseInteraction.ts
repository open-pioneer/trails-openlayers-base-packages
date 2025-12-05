// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { MapModel } from "@open-pioneer/map";
import type { Map } from "ol";
import { EditingInteraction } from "./EditingInteraction";

export abstract class BaseInteraction<O, D> implements EditingInteraction {
    constructor(
        private readonly mapModelObject: MapModel,
        private readonly options: O
    ) {}

    start(): void {
        if (this.state.type === "idle") {
            const data = this.startInteraction(this.options);
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
        return this.mapModelObject;
    }

    protected abstract startInteraction(options: O): D;
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
