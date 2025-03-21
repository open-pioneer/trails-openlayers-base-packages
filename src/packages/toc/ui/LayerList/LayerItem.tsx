// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { FaChevronDown, FaChevronRight } from "react-icons/fa6";
import { reactive } from "@conterra/reactivity-core";
import {
    Box,
    Collapsible,
    CollapsibleContent,
    Flex,
    IconButton,
    Spacer
} from "@chakra-ui/react";
import { Tooltip, Checkbox} from "@open-pioneer/chakra-snippets";
import { AnyLayer } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { memo, ReactNode, useEffect, useId, useMemo } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { TocItem, useTocModel } from "../../model/TocModel";
import { slug } from "../../utils/slug";
import { useChildLayers, useLoadState } from "./hooks";
import { LayerItemMenu } from "./LayerItemMenu";
import { LayerList } from "./LayerList";

/**
 * Renders a single layer as a list item.
 *
 * The item may have further nested list items if there are sublayers present.
 */
export const LayerItem = memo(function LayerItem(props: { layer: AnyLayer }): ReactNode {
    const { layer } = props;
    const intl = useIntl();
    const [tocItem, _tocModel, tocOptions] = useTocItem(layer);
    const expanded = useReactiveSnapshot(() => tocItem.isExpanded, [tocItem]);
    const isCollapsible = tocOptions ? tocOptions.collapsibleGroups : false;

    const layerGroupId = useId();
    const childLayers = useChildLayers(layer);
    const isAvailable = useLoadState(layer) !== "error";
    const notAvailableLabel = intl.formatMessage({ id: "layerNotAvailable" });
    const { title, description, isVisible } = useReactiveSnapshot(() => {
        return {
            title: layer.title,
            description: layer.description,
            isVisible: layer.visible
        };
    }, [layer]);

    let nestedChildren;
    if (childLayers?.length) {
        nestedChildren = (
            <LayerList
                layers={childLayers}
                ml={4}
                aria-label={intl.formatMessage({ id: "childgroupLabel" }, { title: title })}
            />
        );
    }
    return (
        <Box as="li" className={classNames("toc-layer-item", `layer-${slug(layer.id)}`)}>
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
                        hasNestedChildren={!!nestedChildren}
                    />
                )}
                <Checkbox
                    // Keyboard navigation jumps only to Checkboxes and uses the texts inside this DOM node.
                    // The aria-labels of Tooltip and Icon is ignored by screenreader because they are no child element of the checkbox.
                    // To consider the notAvailableLabel, an aria-label at the checkbox is necessary.
                    aria-label={title + (!isAvailable ? " " + notAvailableLabel : "")}
                    checked={isVisible}
                    disabled={!isAvailable}
                    onCheckedChange={(event) =>
                        updateLayerVisibility(
                            layer,
                            Boolean(event.checked.valueOf()),
                            tocOptions.autoShowParents
                        )
                    }
                >
                    {title}
                </Checkbox>
                {!isAvailable && (
                    <Tooltip
                        content={notAvailableLabel}
                        positioning={{placement: "right"}}
                        openDelay={500}
                        contentProps={{className: "toc-layer-item-content-tooltip"}}
                    >
                        <span>
                            <FiAlertTriangle
                                className="toc-layer-item-content-icon"
                                color={"red"}
                                aria-label={notAvailableLabel}
                            />
                        </span>
                    </Tooltip>
                )}
                <Spacer />
                <LayerItemMenu layer={layer} title={title} description={description} intl={intl} />
            </Flex>
            {nestedChildren && (
                <Collapsible.Root open={expanded} id={layerGroupId} className="toc-collapsible-item">
                    <CollapsibleContent>
                        {nestedChildren}
                    </CollapsibleContent>
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
    const icon = expanded ? <FaChevronDown /> : <FaChevronRight />;
    const intl = useIntl();
    return (
        <IconButton
            variant="ghost"
            borderRadius="full"
            padding={0}
            className="toc-layer-item-collapse-button"
            onClick={onClick}
            aria-label={
                expanded
                    ? intl.formatMessage({ id: "group.collapse" }, { title: layerTitle })
                    : intl.formatMessage({ id: "group.expand" }, { title: layerTitle })
            }
            aria-expanded={expanded}
            aria-controls={layerGroupId}
            visibility={hasNestedChildren ? "visible" : "hidden"} //use visible:hidden for layers without children for correct indent
        >
            {icon}
        </IconButton>
    );
}

// Creates a toc item and registers it with the shared toc model.
function useTocItem(layer: AnyLayer) {
    const tocModel = useTocModel();
    const options = useReactiveSnapshot(() => tocModel.options, [tocModel]);
    const tocItem = useMemo((): TocItem => {
        const expanded = reactive(!options.initiallyCollapsed);
        return {
            layerId: layer.id,
            get isExpanded(): boolean {
                return expanded.value;
            },
            setExpanded(expand: boolean) {
                expanded.value = expand;
            }
        };
    }, [layer, options.initiallyCollapsed]);

    // Register the item on the shared toc model
    useEffect(() => {
        tocModel.registerItem(tocItem);
        return () => tocModel.unregisterItem(tocItem);
    }, [tocModel, tocItem]);

    return [tocItem, tocModel, options] as const;
}

function updateLayerVisibility(layer: AnyLayer, visible: boolean, autoShowParents: boolean) {
    layer.setVisible(visible);
    if (visible && autoShowParents && layer.parent) {
        updateLayerVisibility(layer.parent, true, true);
    }
}
