// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive } from "@conterra/reactivity-core";
import { INITIAL_WORKFLOW_STATE, WorkflowState } from "./WorkflowState";
import { DECLARE_SERVICE_INTERFACE } from "@open-pioneer/runtime";

export class WorkflowStateManager {
    declare [DECLARE_SERVICE_INTERFACE]: "app.WorkflowStateManager";

    #workflowState = reactive<WorkflowState>(INITIAL_WORKFLOW_STATE);
    #counter = reactive(0);

    constructor() {}

    get workflowState(): WorkflowState {
        return this.#workflowState.value;
    }

    get counter(): number {
        return this.#counter.value;
    }

    incrementCounter() {
        this.#counter.value += 1;
    }
}
