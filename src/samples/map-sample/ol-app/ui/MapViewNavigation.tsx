// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex } from "@open-pioneer/chakra-integration";
import { NaviHistoryForward, NaviHistoryBackward } from "@open-pioneer/map-navigation";
import { useIntl } from "open-pioneer:react-hooks";
import { MAP_ID } from "../map/MapConfigProviderImpl";
import { useMapModel } from "@open-pioneer/map";
import { ViewHistoryModel } from "@open-pioneer/map-navigation/ViewHistoryModel";
export function MapViewNavigation() {
    const { map } = useMapModel(MAP_ID);
    const intl = useIntl();
    if (!map) {
        return;
    }
    const viewModel = new ViewHistoryModel(map);

    return (
        <Flex
            role="toolbar"
            aria-label={intl.formatMessage({ id: "ariaLabel.toolbar" })}
            direction="row"
            gap={1}
            padding={1}
        >
            <NaviHistoryBackward viewModel={viewModel} />
            <NaviHistoryForward viewModel={viewModel} />
        </Flex>
    );
}
