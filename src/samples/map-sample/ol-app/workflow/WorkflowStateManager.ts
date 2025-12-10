// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive, watchValue } from "@conterra/reactivity-core";
import { Resource } from "@open-pioneer/core";
import { INITIAL_WORKFLOW_STATE, WorkflowState } from "./WorkflowState";
import { DECLARE_SERVICE_INTERFACE } from "@open-pioneer/runtime";

const INITIAL_STATE_SIGNAL = reactive(INITIAL_WORKFLOW_STATE);

if (import.meta.hot) {
    import.meta.hot.accept("./WorkflowState", (module) => {
        if (!module) {
            return;
        }

        const newInitialState = module.INITIAL_WORKFLOW_STATE;
        INITIAL_STATE_SIGNAL.value = newInitialState;
        console.log("new initial state", newInitialState);
    });
}

export class WorkflowStateManager {
    declare [DECLARE_SERVICE_INTERFACE]: "app.WorkflowStateManager";

    #workflowState = reactive<WorkflowState>(INITIAL_WORKFLOW_STATE);
    #counter = reactive(0);

    #watchHandle: Resource | undefined;

    constructor() {
        if (import.meta.hot) {
            this.#watchHandle = watchValue(
                () => INITIAL_STATE_SIGNAL.value,
                (newInitialState) => {
                    console.log("Resetting to new initial state");
                    this.#workflowState.value = newInitialState;
                }
            );
        }
    }

    destroy() {
        if (import.meta.hot) {
            this.#watchHandle?.destroy();
        }
    }

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
