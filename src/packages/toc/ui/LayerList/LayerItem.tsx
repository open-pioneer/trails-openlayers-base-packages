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
    Spacer,
    Text,
    VisuallyHidden
} from "@chakra-ui/react";
import { AnyLayer } from "@open-pioneer/map";
import { classNames } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import { useIntl } from "open-pioneer:react-hooks";
import { memo, ReactNode, useEffect, useId, useMemo, useRef } from "react";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import { TocItemImpl, useTocModel } from "../../model/";
import { TocLayerNode } from "../../new-model/TocLayerNode";
import { slug } from "../../utils/slug";
import { useLayerItemIssues } from "./LayerItemIssues";
import { LayerItemMenu } from "./LayerItemMenu";
import { LayerList } from "./LayerList";

/**
 * Renders a single layer as a list item.
 *
 * The item may have further nested list items if there are sublayers present.
 */
export const LayerItem = memo(function LayerItem(props: { node: TocLayerNode }): ReactNode {
    const { node } = props;
    const layer = node.layer;

    const intl = useIntl();
    const display = useReactiveSnapshot(() => node.isShown, [node]);
    const [tocOptions, tocItemElemRef] = useTocItem(node, display);
    const { isExpanded, isVisible } = useReactiveSnapshot(() => {
        return {
            isExpanded: node.isExpanded,
            isVisible: node.isVisible
        };
    }, [node]);
    const isCollapsible = tocOptions ? tocOptions.collapsibleGroups : false;

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

    const nestedChildren = useNestedChildren(layerGroupId, title, node, intl);
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
                <Collapsible.Root open={isExpanded} className="toc-collapsible-item">
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

// Creates a toc item and registers it with the shared toc model.
function useTocItem(node: TocLayerNode, display: boolean) {
    const tocModel = useTocModel();
    const options = useReactiveSnapshot(() => tocModel.options, [tocModel]);
    const tocItemElemRef = useRef<HTMLDivElement>(null);
    const tocItem = useMemo((): TocItemImpl => {
        return new TocItemImpl(node);
    }, [node]);

    // Register the item on the shared toc model
    useEffect(() => {
        if (!display) {
            return; //prevent registering if item is not displayed
        }
        tocItem.setHtmlElement(tocItemElemRef.current ?? undefined);
        tocModel.registerItem(tocItem);
        return () => {
            tocItem.setHtmlElement(undefined);
            tocModel.unregisterItem(tocItem);
        };
    }, [tocModel, tocItem, display]);

    return [options, tocItemElemRef] as const;
}

function useNestedChildren(
    layerGroupId: string,
    title: string,
    node: TocLayerNode,
    intl: PackageIntl
) {
    const childNodes = useReactiveSnapshot(() => node.children, [node]);
    const children = useMemo(() => {
        if (childNodes?.length) {
            return (
                <LayerList
                    id={layerGroupId}
                    nodes={childNodes}
                    ml={4}
                    aria-label={intl.formatMessage({ id: "childgroupLabel" }, { title: title })}
                />
            );
        }
        return undefined;
    }, [layerGroupId, intl, title, childNodes]);
    return children;
}

function getClassNameForLayer(layer: AnyLayer) {
    return `layer-${slug(layer.id)}`;
}
