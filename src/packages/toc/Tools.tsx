// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Button,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Portal
} from "@open-pioneer/chakra-integration";
import { AnyLayer, MapModel } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { FC } from "react";
import { FiMoreVertical } from "react-icons/fi";
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
    const hide = (layer: AnyLayer) => {
        layer.setVisible(false);

        const children = layer.children?.getItems();
        if (children) {
            for (const child of children) {
                hide(child);
            }
        }
    };

    map?.layers.getOperationalLayers().forEach((layer) => {
        hide(layer);
    });
}
