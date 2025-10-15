// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Collapsible,
    CollapsibleContent,
    Flex,
    Icon,
    IconButton,
    Spacer
} from "@chakra-ui/react";
import { Checkbox } from "@open-pioneer/chakra-snippets/checkbox";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { AnyLayer, isSublayer } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { memo, ReactNode, useEffect, useId, useMemo, useRef } from "react";
import { LuTriangleAlert, LuChevronDown, LuChevronRight, LuInfo } from "react-icons/lu";
import { TocItemImpl, useTocModel } from "../../model/";
import { slug } from "../../utils/slug";
import { useChildLayers, useLoadState } from "./hooks";
import { LayerItemMenu } from "./LayerItemMenu";
import { LayerList } from "./LayerList";
import { LayerTocAttributes } from "../Toc";
import { displayItemForLayer } from "../../utils/displayLayer";

/**
 * Renders a single layer as a list item.
 *
 * The item may have further nested list items if there are sublayers present.
 */
export const LayerItem = memo(function LayerItem(props: { layer: AnyLayer }): ReactNode {
    const { layer } = props;

    const intl = useIntl();
    const display = useReactiveSnapshot(() => displayItemForLayer(layer), [layer]);
    const [tocItem, _tocModel, tocOptions, tocItemElemRef] = useTocItem(layer, display);
    const expanded = useReactiveSnapshot(() => tocItem.isExpanded, [tocItem]);
    const isCollapsible = tocOptions ? tocOptions.collapsibleGroups : false;

    const layerGroupId = useId();
    const isAvailable = useLoadState(layer) !== "error";
    const listMode = useListMode(layer)?.listMode;

    const { visibleInScale } = useReactiveSnapshot(() => {
        return {
            visibleInScale: hasVisibleProp(layer)
        };
    }, [layer]);

    const notAvailableLabel = intl.formatMessage({ id: "layerNotAvailable" });
    const notVisibleLabel = intl.formatMessage({ id: "layerNotVisible" });
    const { title, description, isVisible, allChildrenHidden } = useReactiveSnapshot(() => {
        return {
            title: layer.title,
            description: layer.description,
            isVisible: layer.visible,
            allChildrenHidden: !hasShownChildren(layer) //re-evaluates if a child layer's list mode or internal state changes
        };
    }, [layer]);

    const nestedChildren = useNestedChildren(layerGroupId, title, layer, intl);
    let hasNestedChildren = !!nestedChildren;


    if (!display) {
        return null;
    } 
    //all children hidden => do not render collapse button and child entries
    if (allChildrenHidden || listMode === "hide-children") {
        hasNestedChildren = false;
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
                        expanded={expanded}
                        onClick={() => tocItem.setExpanded(!expanded)}
                        hasNestedChildren={hasNestedChildren}
                    />
                )}
                <Checkbox
                    // Keyboard navigation jumps only to Checkboxes and uses the texts inside this DOM node.
                    // The aria-labels of Tooltip and Icon is ignored by screen reader because they are no child element of the checkbox.
                    // To consider the notAvailableLabel, an aria-label at the checkbox is necessary.
                    aria-label={
                        title + (!isAvailable || !visibleInScale ? " " + notAvailableLabel : "")
                    }
                    checked={isVisible}
                    disabled={!isAvailable || !visibleInScale}
                    onCheckedChange={(event) =>
                        updateLayerVisibility(
                            layer,
                            event.checked === true,
                            tocOptions.autoShowParents
                        )
                    }
                >
                    {title}
                </Checkbox>
                {!isAvailable && (
                    <Tooltip
                        content={notAvailableLabel}
                        positioning={{ placement: "right" }}
                        openDelay={500}
                        contentProps={{ className: "toc-layer-item-content-tooltip" }}
                    >
                        <span>
                            <LuTriangleAlert
                                className="toc-layer-item-content-icon"
                                color={"red"}
                                aria-label={notAvailableLabel}
                            />
                        </span>
                    </Tooltip>
                )}
                {!visibleInScale && isAvailable && (
                    <Tooltip
                        content={notVisibleLabel}
                        positioning={{ placement: "right" }}
                        openDelay={500}
                        contentProps={{ className: "toc-layer-item-content-tooltip" }}
                    >
                        <span>
                            <LuInfo
                                className="toc-layer-item-content-icon"
                                aria-label={notVisibleLabel}
                            />
                        </span>
                    </Tooltip>
                )}
                <Spacer />
                <LayerItemMenu layer={layer} title={title} description={description} intl={intl} />
            </Flex>
            {hasNestedChildren && (
                <Collapsible.Root open={expanded} className="toc-collapsible-item">
                    <CollapsibleContent>{nestedChildren}</CollapsibleContent>
                </Collapsible.Root>
            )}
        </Box>
    );
});

function useNestedChildren(
    layerGroupId: string,
    title: string,
    layer: AnyLayer,
    intl: PackageIntl
) {
    const childLayers = useChildLayers(layer);
    const children = useMemo(() => {
        if (childLayers?.length) {
            return (
                <LayerList
                    id={layerGroupId}
                    layers={childLayers}
                    ml={4}
                    aria-label={intl.formatMessage({ id: "childgroupLabel" }, { title: title })}
                />
            );
        }
        return undefined;
    }, [layerGroupId, intl, title, childLayers]);
    return children;
}

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
function useTocItem(layer: AnyLayer, display: boolean) {
    const tocModel = useTocModel();
    const options = useReactiveSnapshot(() => tocModel.options, [tocModel]);
    const tocItemElemRef = useRef<HTMLDivElement>(null);
    const tocItem = useMemo((): TocItemImpl => {
        return new TocItemImpl(layer, tocModel, !options.initiallyCollapsed);
    }, [layer, options.initiallyCollapsed, tocModel]);

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

    return [tocItem, tocModel, options, tocItemElemRef] as const;
}

function useListMode(layer: AnyLayer): LayerTocAttributes | undefined {
    return useReactiveSnapshot(
        () => layer.attributes.toc as LayerTocAttributes | undefined,
        [layer]
    );
}

function updateLayerVisibility(layer: AnyLayer, visible: boolean, autoShowParents: boolean) {
    layer.setVisible(visible);
    if (visible && autoShowParents && layer.parent) {
        updateLayerVisibility(layer.parent, true, true);
    }
}

function getClassNameForLayer(layer: AnyLayer) {
    return `layer-${slug(layer.id)}`;
}

/**
 * Checks if at least on child layer of the given layer exists and should be displayed.
 * @param layer
 * @returns true if at least one child layer's display mode is not `hide`
 */
function hasShownChildren(layer: AnyLayer): boolean {
    if (!layer.children || layer.children.getItems().length === 0) {
        return false;
    } else {
        return layer.children.getItems().some((childLayer) => {
            const isDisplayed = displayItemForLayer(childLayer);
            return isDisplayed;
        });
    }
}



function hasVisibleProp(layer: AnyLayer) {
    const target =
        (isSublayer(layer) || layer.parent?.type === "group") && layer.parent
            ? layer.parent
            : layer;

    return "visibleInScale" in target ? target.visibleInScale : true;
}
