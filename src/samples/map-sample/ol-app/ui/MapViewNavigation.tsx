// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMapModel } from "@open-pioneer/map";
import { HistoryBackward, HistoryForward } from "@open-pioneer/map-navigation";
import { ViewHistoryModel } from "@open-pioneer/map-navigation/ViewHistoryModel";
import { useEffect, useState } from "react";
import { MAP_ID } from "../map/MapConfigProviderImpl";

export function MapViewNavigation() {
    const { map } = useMapModel(MAP_ID);
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
        viewModel && (
            <>
                <HistoryBackward viewModel={viewModel} />
                <HistoryForward viewModel={viewModel} />
            </>
        )
    );
}
