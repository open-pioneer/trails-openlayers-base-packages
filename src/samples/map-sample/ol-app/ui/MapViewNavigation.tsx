// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex } from "@open-pioneer/chakra-integration";
import { HistoryForward, HistoryBackward } from "@open-pioneer/map-navigation";
import { useIntl } from "open-pioneer:react-hooks";
import { MAP_ID } from "../map/MapConfigProviderImpl";
import { useMapModel } from "@open-pioneer/map";
import { ViewHistoryModel } from "@open-pioneer/map-navigation/ViewHistoryModel";
import { useEffect, useState } from "react";
export function MapViewNavigation() {
    const { map } = useMapModel(MAP_ID);
    const intl = useIntl();
    const [viewModel, setViewModel] = useState<ViewHistoryModel | undefined>(undefined);
    useEffect(() => {
        if (!map) {
            return;
        }
        // Initialized on mount or (in theory) if the map changes
        const newViewModel = new ViewHistoryModel(map);
        setViewModel(newViewModel);
        // Automatically cleaned up by react
        return () => newViewModel.destroy();
    }, [map]);

    return (
        <>
            {viewModel && (
                <Flex
                    role="toolbar"
                    aria-label={intl.formatMessage({ id: "ariaLabel.toolbar" })}
                    direction="row"
                    gap={1}
                    padding={1}
                >
                    {" "}
                    <HistoryBackward viewModel={viewModel} />
                    <HistoryForward viewModel={viewModel} />
                </Flex>
            )}
        </>
    );
}
