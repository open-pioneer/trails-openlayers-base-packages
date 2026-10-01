// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import {
    Box,
    Checkbox,
    Collapsible,
    CollapsibleContent,
    Flex,
    Icon,
    IconButton,
    ListRootProps,
    Spacer,
    Text,
    VisuallyHidden
} from "@chakra-ui/react";
import { AnyLayer } from "@open-pioneer/map";
import { classNames } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import { useIntl } from "open-pioneer:react-hooks";
import { memo, ReactNode, useCallback, useId, useMemo } from "react";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import { TocLayerNode } from "../../model/TocLayerNode";
import { slug } from "../../utils/slug";
import { useLayerItemIssues } from "./LayerItemIssues";
import { LayerItemMenu } from "./LayerItemMenu";

/**
 * Renders a single layer as a list item.
 *
 * The item may have further nested list items if there are sublayers present.
 */
export const LayerItem = memo(function LayerItem(props: {
    /**
     * The layer node to render.
     */
    node: TocLayerNode;
    /**
     * Callback to render a nested list for child layer nodes of this LayerItem.
     */
    renderNestedList: (nodes: TocLayerNode[], listProps: ListRootProps) => ReactNode;
}): ReactNode {
    const { node, renderNestedList } = props;
    const layer = node.layer;

    const intl = useIntl();
    const display = useReactiveSnapshot(() => node.isShown, [node]);
    const tocItemElemRef = useItemElementRef(node, display);
    const { isExpanded, isVisible } = useReactiveSnapshot(() => {
        return {
            isExpanded: node.isExpanded,
            isVisible: node.isVisible
        };
    }, [node]);
    const isCollapsible = useReactiveSnapshot(() => {
        return node.options.collapsibleGroups ?? false;
    }, [node]);

    const layerGroupId = useId();
    const { title, description } = useReactiveSnapshot(() => {
        return {
            title: layer.title,
            description: layer.description
        };
    }, [layer]);

    const {
        indicator: issueIndicator,
        label: issueLabel,
        muted,
        disabled
    } = useLayerItemIssues(node);

    const nestedChildren = useNestedChildren({
        layerGroupId,
        title,
        node,
        intl,
        renderNestedList
    });
    //all children hidden => do not render collapse button and child entries
    const hasNestedChildren = useReactiveSnapshot(() => {
        return node.shouldShowChildren && node.hasShownChildren;
    }, [node]);

    if (!display) {
        return null;
    }

    return (
        <Box
            as="li"
            className={classNames("toc-layer-item", getClassNameForLayer(layer))}
            ref={tocItemElemRef}
        >
            <Flex
                className="toc-layer-item-content"
                width="100%"
                flexDirection="row"
                align="center"
                justifyContent="space-between"
                /** Gap to prevent bleeding of the buttons hover style into the layer title */
                gap={2}
                /** Aligned to the size of the (potential) menu button in LayerItemDescriptor */
                minHeight={10}
            >
                {isCollapsible && (
                    <CollapseButton
                        layerTitle={title}
                        layerGroupId={layerGroupId}
                        expanded={isExpanded}
                        onClick={() => node.setExpanded(!isExpanded)}
                        hasNestedChildren={hasNestedChildren}
                    />
                )}

                <Checkbox.Root
                    checked={isVisible}
                    disabled={disabled}
                    onCheckedChange={(event) => node.setVisible(event.checked === true)}
                >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control>
                        <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Label>
                        <Text as="span" opacity={muted ? 0.5 : undefined}>
                            {title}
                        </Text>
                        {/* Same content as tooltip */}
                        {issueLabel && <VisuallyHidden as="div">{issueLabel}</VisuallyHidden>}
                    </Checkbox.Label>
                </Checkbox.Root>
                {issueIndicator}
                <Spacer />
                <LayerItemMenu title={title} description={description} disabled={disabled} />
            </Flex>
            {hasNestedChildren && (
                <Collapsible.Root
                    open={isExpanded}
                    className="toc-collapsible-item"
                    lazyMount={true}
                >
                    <CollapsibleContent>{nestedChildren}</CollapsibleContent>
                </Collapsible.Root>
            )}
        </Box>
    );
});

function CollapseButton(props: {
    layerTitle: string;
    layerGroupId: string;
    expanded: boolean;
    onClick: () => void;
    hasNestedChildren: boolean;
}) {
    const { layerTitle, layerGroupId, expanded, onClick, hasNestedChildren } = props;
    const icon = expanded ? <LuChevronDown /> : <LuChevronRight />;
    const intl = useIntl();
    return (
        <IconButton
            variant="ghost"
            borderRadius="full"
            padding={0}
            className="toc-layer-item-collapse-button"
            onClick={onClick}
            size="sm"
            focusRingOffset="-2px"
            aria-label={
                expanded
                    ? intl.formatMessage({ id: "group.collapse" }, { title: layerTitle })
                    : intl.formatMessage({ id: "group.expand" }, { title: layerTitle })
            }
            aria-expanded={expanded}
            aria-controls={layerGroupId}
            //use visible:hidden for layers without children for correct indent
            visibility={hasNestedChildren ? "visible" : "hidden"}
            css={{
                // Chakra theme adds a background to components with "aria-expanded" by default.
                "&:is([aria-expanded='true']):not(:hover)": {
                    background: "none"
                }
            }}
        >
            <Icon>{icon}</Icon>
        </IconButton>
    );
}

// Creates a toc item element ref and register / deregister it on the node.
function useItemElementRef(node: TocLayerNode, display: boolean) {
    return useCallback(
        (htmlElement: HTMLElement | null) => {
            if (!display) return;
            node.setHtmlElement(htmlElement ?? undefined);

            return () => {
                // todo write unit test
                node.setHtmlElement(undefined);
            };
        },
        [node, display]
    );
}

function useNestedChildren(props: {
    layerGroupId: string;
    title: string;
    node: TocLayerNode;
    intl: PackageIntl;
    renderNestedList: (nodes: TocLayerNode[], listProps: ListRootProps) => ReactNode;
}) {
    const { layerGroupId, title, node, intl, renderNestedList } = props;
    const childNodes = useReactiveSnapshot(() => node.shownChildren, [node]);
    const children = useMemo(() => {
        if (childNodes?.length) {
            return renderNestedList(childNodes, {
                id: layerGroupId,
                ml: 4,
                "aria-label": intl.formatMessage({ id: "childgroupLabel" }, { title: title })
            });
        }
        return undefined;
    }, [layerGroupId, intl, title, childNodes, renderNestedList]);
    return children;
}

function getClassNameForLayer(layer: AnyLayer) {
    return `layer-${slug(layer.id)}`;
}
