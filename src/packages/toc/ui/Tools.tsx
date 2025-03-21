// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Button,
    Menu,
} from "@chakra-ui/react";
import { AnyLayer, MapModel } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, memo } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { TocModel, useTocModel } from "../model/TocModel";
import { ToolsConfig } from "./Toc";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";

export interface ToolsProps extends ToolsConfig {
    map: MapModel;
}

export const Tools: FC<ToolsProps> = memo(function Tools(props: ToolsProps) {
    const intl = useIntl();
    const tocModel = useTocModel();
    const collapsibleGroups = useReactiveSnapshot(
        () => tocModel.options.collapsibleGroups,
        [tocModel]
    );
    const {
        map,
        showHideAllLayers = true,
        showCollapseAllGroups: showCollapseAllGroupsProp = collapsibleGroups
    } = props;

    // Only respected if groups are collapsible
    const showCollapseAllGroups = collapsibleGroups && showCollapseAllGroupsProp;
    const hasContent = showHideAllLayers || showCollapseAllGroups;
    return (
        hasContent && (
            <Box className="toc-tools">
                <Menu.Root positioning={{placement: "bottom-start"}} >
                    <Menu.Trigger asChild>
                        <Button                         
                            className="toc-tools-button"
                            aria-label={intl.formatMessage({ id: "toolsLabel" })}
                            borderRadius="full"
                            padding={3}
                            variant="ghost">
                            <FiMoreVertical />
                        </Button>
                    </Menu.Trigger>
                    <Menu.Positioner>
                        <Menu.Content className="tools-menu">
                            {showHideAllLayers && (
                                <Menu.Item
                                    aria-label={intl.formatMessage({ id: "tools.hideAllLayers" })}
                                    onClick={() => {
                                        hideAllLayers(map);
                                    }}
                                    value="hideAllLayers"
                                >
                                    {intl.formatMessage({ id: "tools.hideAllLayers" })}
                                </Menu.Item>
                            )}
                            {showCollapseAllGroups && (
                                <Menu.Item
                                    aria-label={intl.formatMessage({
                                        id: "tools.collapseAllGroups"
                                    })}
                                    onClick={() => {
                                        collapseAllGroups(tocModel);
                                    }}
                                    value="collapseAllGroups"
                                >
                                    {intl.formatMessage({ id: "tools.collapseAllGroups" })}
                                </Menu.Item>
                            )}
                        </Menu.Content>
                    </Menu.Positioner>
                </Menu.Root>
            </Box>
        )
    );
});

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

function collapseAllGroups(tocModel: TocModel) {
    tocModel.getItems().forEach((item) => item.setExpanded(false));
}
