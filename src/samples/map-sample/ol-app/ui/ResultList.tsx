// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box } from "@open-pioneer/chakra-integration";
import { ResultList } from "@open-pioneer/result-list";
import { AppModel } from "../AppModel";
import { useSnapshot } from "valtio";
import { useService } from "open-pioneer:react-hooks";

export function ResultListComponent() {
    const appModel = useService<unknown>("ol-app.AppModel") as AppModel;
    const input = useSnapshot(appModel.state).currentResultListInput;
    if (!input) {
        return undefined;
    }
    return (
        <Box className="result-list" backgroundColor="white" width="100%" height="300px">
            <ResultList resultListInput={input} />
        </Box>
    );
}