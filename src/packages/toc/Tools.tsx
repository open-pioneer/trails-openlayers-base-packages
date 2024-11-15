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
import { MapModel, SublayersCollection } from "@open-pioneer/map";
import { ToolsConfig } from "./Toc";

export const Tools: FC<{ map: MapModel; onCollapseAllGroups?: () => void } & ToolsConfig> = (
    props
) => {
    const intl = useIntl();
    const {
        map,
        onCollapseAllGroups,
        showHideAllLayers = true,
        showCollapseAllGroups = true
    } = props;

    const noEntry = !showHideAllLayers && !showCollapseAllGroups;

    return (
        !noEntry && (
            <Box className="toc-tools">
                <Menu placement="bottom-start">
                    <MenuButton
                        as={Button}
                        className="toc-tools-button"
                        aria-label={intl.formatMessage({ id: "toolsLabel" })}
                        borderRadius="full"
                        iconSpacing={0}
                        padding={3}
                        variant="ghost"
                        leftIcon={<FiMoreVertical />}
                    />
                    <Portal>
                        <MenuList className="tools-menu">
                            {showHideAllLayers && (
                                <MenuItem
                                    aria-label={intl.formatMessage({ id: "tools.hideAllLayers" })}
                                    onClick={() => {
                                        hideAllLayers(map);
                                    }}
                                >
                                    {intl.formatMessage({ id: "tools.hideAllLayers" })}
                                </MenuItem>
                            )}
                            {showCollapseAllGroups && (
                                <MenuItem
                                    aria-label={intl.formatMessage({
                                        id: "tools.collapseAllGroups"
                                    })}
                                    onClick={() => {
                                        if (onCollapseAllGroups) {
                                            onCollapseAllGroups();
                                        }
                                    }}
                                >
                                    {intl.formatMessage({ id: "tools.collapseAllGroups" })}
                                </MenuItem>
                            )}
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
