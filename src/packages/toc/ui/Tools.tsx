// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, Icon, IconButton, Menu, Portal } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, memo, useId } from "react";
import { LuEllipsisVertical } from "react-icons/lu";
import { TocModel, useTocModel } from "../model";
import { TocLayerNode } from "../new-model/TocLayerNode";
import { TocViewModel } from "../new-model/TocViewModel";
import { ToolsConfig } from "./Toc";

export interface ToolsProps extends ToolsConfig {
    viewModel: TocViewModel; // TODO: Consider using useContext for the view model and the map?
}

export const Tools: FC<ToolsProps> = memo(function Tools(props: ToolsProps) {
    const intl = useIntl();
    const tocModel = useTocModel();

    const {
        showHideAllLayers = true,
        showCollapseAllGroups: showCollapseAllGroupsProp = true,
        viewModel
    } = props;

    // Only respected if groups are collapsible
    const collapsibleGroups = useReactiveSnapshot(
        () => viewModel.options.collapsibleGroups,
        [viewModel]
    );
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
                                            hideAllLayers(viewModel);
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
                        <LuEllipsisVertical spacing={0} />
                    </Icon>
                </IconButton>
            </Menu.Trigger>
        </Tooltip>
    );
}

function hideAllLayers(viewModel: TocViewModel) {
    const hide = (node: TocLayerNode) => {
        node.setVisible(false);
        for (const child of node.shownChildren) {
            hide(child);
        }
    };

    for (const node of viewModel.shownChildren) {
        hide(node);
    }
}

// TODO: use new view model
function collapseAllGroups(tocModel: TocModel) {
    tocModel.getItems().forEach((item) => item.setExpanded(false));
}
