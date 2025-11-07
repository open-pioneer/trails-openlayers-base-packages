// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Flex,
    IconButton
} from "@chakra-ui/react";
import { MapModel, Overlay } from "@open-pioneer/map";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { useIntl } from "open-pioneer:react-hooks";
import { useState } from "react";
import {
    LuArrowLeft,
    LuArrowRight,
    LuThermometerSnowflake
} from "react-icons/lu";

export function Toolbar(props: { map: MapModel }) {
    const { map } = props;
    const intl = useIntl();
    const [tooltip, setTooltip] = useState<Overlay | undefined>();

    return (
        <Flex
            role="toolbar"
            aria-label={intl.formatMessage({ id: "ariaLabel.toolbar" })}
            direction="column"
            gap={1}
            padding={1}
        >
            <InitialExtent />
            <ZoomIn />
            <ZoomOut />
            <ToolButton
                label="Toggle Tooltip"
                icon={<LuThermometerSnowflake />}
                active={tooltip != undefined}
                onClick={() => {
                    if (!tooltip) {
                        const initialPosition =  [410000, 5759500];
                        const content = <Box width={"100px"} height={"100px"} background="red">{initialPosition[0]}, {initialPosition[1]}</Box>;
                        const tooltip = map.overlays.addOverlay({position: initialPosition, insertFirst: false, autoPan: true}, content);
                        setTooltip(tooltip);
                    } else {
                        const successful = map.overlays.removeOverlay(tooltip);
                        if (successful) {
                            setTooltip(undefined);
                        }
                    }
                }
                }
            />
            {
                tooltip && (
                    <IconButton onClick={() => {
                        const pos = tooltip.getPosition();
                        if (pos && pos[0] && pos[1]) {
                            const newPos = [pos[0] + 500, pos[1]];
                            tooltip.setPosition(newPos);
                            tooltip.setContent(<Box width={"100px"} height={"100px"} background="red">{newPos[0]}, {newPos[1]}</Box>);
                        }
                    }}><LuArrowRight></LuArrowRight></IconButton>
                )
            }
            {
                tooltip && (
                    <IconButton onClick={() => {
                        const pos = tooltip.getPosition();
                        if (pos && pos[0] && pos[1]) {
                            const newPos = [pos[0] - 500, pos[1]];
                            tooltip.setPosition(newPos);
                            tooltip.setContent(<Box width={"100px"} height={"100px"} background="red">{newPos[0]}, {newPos[1]}</Box>);
                        }
                    }}><LuArrowLeft></LuArrowLeft></IconButton>
                )
            }
        </Flex>
    );
}

