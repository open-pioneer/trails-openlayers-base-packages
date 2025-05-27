// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, IconButton, Menu, Portal, Icon } from "@chakra-ui/react";
import { AnyLayer, MapModel } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, memo, useId } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { TocModel, useTocModel } from "../model/TocModel";
import { ToolsConfig } from "./Toc";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";

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

    const triggerId = useId(); // see https://chakra-ui.com/docs/components/tooltip#with-menutrigger

    return (
        hasContent && (
            <Box className="toc-tools">
                <Menu.Root ids={{ trigger: triggerId }} positioning={{ placement: "bottom-start" }}>
                    <TriggerButton triggerId={triggerId} />
                    <Portal>
                        <Menu.Positioner>
                            <Menu.Content className="toc-tools-menu">
                                {showHideAllLayers && (
                                    <Menu.Item
                                        aria-label={intl.formatMessage({
                                            id: "tools.hideAllLayers"
                                        })}
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
                    </Portal>
                </Menu.Root>
            </Box>
        )
    );
});

function TriggerButton(props: { triggerId: string }) {
    const { triggerId } = props;
    const intl = useIntl();
    const label = intl.formatMessage({ id: "toolsLabel" });
    return (
        <Tooltip ids={{ trigger: triggerId }} content={label}>
            <Menu.Trigger asChild>
                <IconButton
                    className="toc-tools-button"
                    aria-label={label}
                    borderRadius="full"
                    focusRingOffset="-2px"
                    variant="ghost"
                    padding={0}
                    size="sm"
                >
                    <Icon>
                        <FiMoreVertical spacing={0} />
                    </Icon>
                </IconButton>
            </Menu.Trigger>
        </Tooltip>
    );
}

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
