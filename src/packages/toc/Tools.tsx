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
import { GroupLayerCollection, MapModel, SublayersCollection } from "@open-pioneer/map";
import { ToolsConfig } from "./Toc";

export const Tools: FC<{ map: MapModel } & ToolsConfig> = (props) => {
    const intl = useIntl();
    const { map, showHideAllLayers = true } = props;

    const noEntry = !showHideAllLayers;

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
                            <MenuItem
                                aria-label={intl.formatMessage({ id: "tools.hideAllLayers" })}
                                onClick={() => {
                                    hideAllLayers(map);
                                }}
                            >
                                {intl.formatMessage({ id: "tools.hideAllLayers" })}
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
    const hideGroupChildlayer = (childlayers: GroupLayerCollection | undefined) => {
        childlayers?.getLayers().forEach((layer) => {
            layer.setVisible(false);

            hideGroupChildlayer(layer?.layers);
        });
    };

    map?.layers.getOperationalLayers().forEach((layer) => {
        layer.setVisible(false);

        hideSublayer(layer?.sublayers);
        hideGroupChildlayer(layer?.layers);
    });
}
