// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { useService } from "open-pioneer:react-hooks";
import { WorkflowStateManager } from "./WorkflowStateManager";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { Box, Button, Code, VStack } from "@chakra-ui/react";

export function WorkflowUI() {
    const workflowStateManager = useService<WorkflowStateManager>("app.WorkflowStateManager");
    const currentState = useReactiveSnapshot(
        () => workflowStateManager.workflowState,
        [workflowStateManager]
    );
    const currentCounter = useReactiveSnapshot(
        () => workflowStateManager.counter,
        [workflowStateManager]
    );

    return (
        <VStack>
            <Box>
                Workflow state: <Code>{JSON.stringify(currentState, undefined, 4)}</Code>
            </Box>
            <Box>
                Counter: {currentCounter}{" "}
                <Button onClick={() => workflowStateManager.incrementCounter()}>Inc</Button>
            </Box>
        </VStack>
    );
}
