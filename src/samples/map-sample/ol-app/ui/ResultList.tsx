// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { ResultList } from "@open-pioneer/result-list";
import { useService } from "open-pioneer:react-hooks";
import { useSnapshot } from "valtio";
import { AppModel } from "../AppModel";
import { MAP_ID } from "../MapConfigProviderImpl";

export function ResultListComponent() {
    const appModel = useService<unknown>("ol-app.AppModel") as AppModel;
    const state = useSnapshot(appModel.state).resultListState;
    return (
        state.input && (
            <Box
                className="result-list-container"
                position="absolute"
                visibility={state.open ? "visible" : "hidden"}
                bottom="0"
                backgroundColor="white"
                width="100%"
                height="400px"
                zIndex={1}
                borderTop="2px solid"
                borderBottom="2px solid"
                borderColor={"trails.100"}
            >
                <ResultList key={state.key} input={state.input} mapId={MAP_ID} />
            </Box>
        )
    );
}
