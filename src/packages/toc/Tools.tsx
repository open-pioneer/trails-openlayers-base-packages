// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Button,
    Box,
    Portal
} from "@open-pioneer/chakra-integration";
import { FC } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { useIntl } from "open-pioneer:react-hooks";
import { MapModel, SublayersCollection, useMapModel } from "@open-pioneer/map";
import { ToolConfig } from "./Toc";

export const Tools: FC<{ mapId: string } & ToolConfig> = (props) => {
    const intl = useIntl();
    const { mapId, showHideAllLayers = true } = props;
    const { map } = useMapModel(mapId);

    const noEntry = !showHideAllLayers;

    return (
        !noEntry && (
            <Box className="tools">
                <Menu placement="bottom-start">
                    <Button
                        as={MenuButton}
                        className="tools-button"
                        aria-label={intl.formatMessage({ id: "toolsLabel" })}
                        borderRadius="full"
                        iconSpacing={0}
                        padding={0}
                        variant="ghost"
                        leftIcon={<FiMoreVertical />}
                    />
                    <Portal>
                        <MenuList className="tools-menu">
                            <MenuItem
                                aria-label={intl.formatMessage({ id: "hideAllLayers" })}
                                onClick={() => {
                                    hideAllLayers(map);
                                }}
                            >
                                {intl.formatMessage({ id: "hideAllLayers" })}
                            </MenuItem>
                        </MenuList>
                    </Portal>
                </Menu>
            </Box>
        )
    );
};

function hideAllLayers(map: MapModel | undefined) {
    const hideSublayer = (sublayers: SublayersCollection | undefined) => {
        sublayers?.getSublayers().forEach((layer) => {
            layer.setVisible(false);

            hideSublayer(layer?.sublayers);
        });
    };

    map?.layers.getOperationalLayers().forEach((layer) => {
        layer.setVisible(false);

        hideSublayer(layer?.sublayers);
    });
}
