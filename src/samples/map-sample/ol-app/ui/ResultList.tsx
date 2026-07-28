// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box } from "@chakra-ui/react";
import { BaseFeature } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { ResultList, ResultListSelectionChangeEvent } from "@open-pioneer/result-list";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { useState, useCallback, useEffect } from "react";
import { AppModel } from "../AppModel";

export function ResultListComponent() {
    const appModel = useService<unknown>("ol-app.AppModel") as AppModel;
    const intl = useIntl();
    const state = useReactiveSnapshot(() => appModel.resultListState, [appModel]);
    const [selectedFeatures, setSelectedFeatures] = useState<BaseFeature[]>([]);
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const selectionChangeListener = useCallback((event: ResultListSelectionChangeEvent) => {
        setSelectedFeatures(event.features);
        setSelectedIds(event.getFeatureIds());
    }, []);

    useEffect(() => {
        console.log("Anzahl Features: " + selectedFeatures.length);
        console.log("SelectedIds: " + selectedIds.toString());
    }, [selectedFeatures, selectedIds]);

    return (
        state.input && (
            <Box
                className="result-list-container"
                role="region"
                aria-label={intl.formatMessage({ id: "ariaLabel.results" })}
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
                    onSelectionChange={selectionChangeListener}
                />
            </Box>
        )
    );
}
