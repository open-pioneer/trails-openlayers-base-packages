// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Stack } from "@chakra-ui/react";
import { useIntl } from "open-pioneer:react-hooks";
import { BusradarLineFilter } from "./BusradarLineFilter";
import { LayerOption } from "./LayerOption";

export function LayerPanelContent(props: {
    busradarAvailableLines: string[];
    busradarSelectedLines: string[];
    transitStopsLayerIsActive: boolean;
    onAddBusradarLineFilter: (line: string) => void;
    onRemoveBusradarLineFilter: (line: string) => void;
    onResetBusradarLineFilter: () => void;
    onToggleTransitStopsLayer: (isActive: boolean) => void;
}) {
    const intl = useIntl();

    return (
        <Stack gap="0.55rem">
            <BusradarLineFilter
                availableLines={props.busradarAvailableLines}
                selectedLines={props.busradarSelectedLines}
                onAddLine={props.onAddBusradarLineFilter}
                onRemoveLine={props.onRemoveBusradarLineFilter}
                onReset={props.onResetBusradarLineFilter}
            />
            <LayerOption
                label={intl.formatMessage({ id: "layerPanel.transitStopsToggle" })}
                info={intl.formatMessage({
                    id: "layerPanel.transitStopsLayerDescription"
                })}
                checked={props.transitStopsLayerIsActive}
                onChange={props.onToggleTransitStopsLayer}
            />
        </Stack>
    );
}
