// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { ResultList } from "@open-pioneer/result-list";
import { useService } from "open-pioneer:react-hooks";
import { useSnapshot } from "valtio";
import { AppModel } from "../AppModel";
import { MAP_ID } from "../MapConfigProviderImpl";
import { BaseFeature } from "@open-pioneer/map";
import { useState, useCallback } from "react";
import { ResultListSelectionChangedEvent } from "@open-pioneer/result-list/ResultList";

export function ResultListComponent() {
    const appModel = useService<unknown>("ol-app.AppModel") as AppModel;
    const state = useSnapshot(appModel.state).resultListState;
    const [selectedFeatures, setSelectedFeatures] = useState<BaseFeature[]>([]);
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const selectionChangeListener = useCallback((_event: ResultListSelectionChangedEvent) => {
        setSelectedFeatures(_event.features);
        setSelectedIds(_event.getFeatureIds());
    }, []);
    console.log("Anzahl Features: " + selectedFeatures.length);
    console.log("SelectedIds: " + selectedIds.toString());
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
                <ResultList
                    key={state.key}
                    input={state.input}
                    mapId={MAP_ID}
                    onSelectionChanged={selectionChangeListener}
                />
            </Box>
        )
    );
}
