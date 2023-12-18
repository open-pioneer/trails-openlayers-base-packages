// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Button,
    MenuDivider
} from "@open-pioneer/chakra-integration";
import { FC } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { useIntl } from "open-pioneer:react-hooks";
import { MapModel, SublayersCollection, useMapModel } from "@open-pioneer/map";
import { ToolConfig } from "./Toc";

export const Tools: FC<{ mapId: string } & ToolConfig> = (props) => {
    const intl = useIntl();
    const { mapId, showHideAllLayers = true, showCollapseGroups = true } = props;
    const { map } = useMapModel(mapId);

    const noEntry = !showHideAllLayers && !showCollapseGroups;

    return (
        <Menu>
            <Button
                as={MenuButton}
                className="toc-tools-button"
                aria-label={intl.formatMessage({ id: "toolsLabel" })}
                borderRadius="full"
                iconSpacing={0}
                padding={0}
                variant="ghost"
                leftIcon={<FiMoreVertical />}
            />
            <MenuList>
                {/* Show `hide all layers` entry, if no entry is set to true */}
                {(showHideAllLayers || noEntry) && (
                    <MenuItem
                        onClick={() => {
                            hideAllLayers(map);
                        }}
                    >
                        {intl.formatMessage({ id: "hideAllLayers" })}
                    </MenuItem>
                )}

                {/* Show menu divider only, if `hide all layers` AND `collapse groups` entries are shown */}
                {showHideAllLayers && showCollapseGroups && <MenuDivider />}

                {showCollapseGroups && (
                    <MenuItem>{intl.formatMessage({ id: "collapseGroups" })}</MenuItem>
                )}
            </MenuList>
        </Menu>
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
