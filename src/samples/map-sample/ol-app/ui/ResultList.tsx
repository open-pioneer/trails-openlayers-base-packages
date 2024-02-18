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
    const input = useSnapshot(appModel.state).currentResultListInput;
    if (!input) {
        return undefined;
    }
    return (
        <Box
            className="result-list-container"
            position="absolute"
            bottom="0"
            backgroundColor="white"
            width="100%"
            height="400px"
            zIndex={1}
            borderTop="2px solid"
            borderBottom="2px solid"
            borderColor={"trails.100"}
        >
            <ResultList input={input} mapId={MAP_ID} />
        </Box>
    );
}
