// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { reactive } from "@conterra/reactivity-core";
import {
    Box,
    Checkbox,
    Collapse,
    Flex,
    IconButton,
    Spacer,
    Tooltip
} from "@open-pioneer/chakra-integration";
import { AnyLayer } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { memo, ReactNode, useEffect, useId, useMemo } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { ExpandLayerItemOptions, TocItem, useTocModel } from "../../model/TocModel";
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
        <Box as="li" className={classNames("toc-layer-item", getClassNameForLayer(layer))}>
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
                    isChecked={isVisible}
                    isDisabled={!isAvailable}
                    onChange={(event) =>
                        updateLayerVisibility(
                            layer,
                            event.target.checked,
                            tocOptions.autoShowParents
                        )
                    }
                >
                    {title}
                </Checkbox>
                {!isAvailable && (
                    <Tooltip
                        className="toc-layer-item-content-tooltip"
                        label={notAvailableLabel}
                        placement="right"
                        openDelay={500}
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
                <Collapse in={expanded} id={layerGroupId} className="toc-collapsible-item">
                    {nestedChildren}
                </Collapse>
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
    const intl = useIntl();
    return (
        <IconButton
            variant="ghost"
            borderRadius="full"
            padding={0}
            className="toc-layer-item-collapse-button"
            onClick={onClick}
            icon={expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            aria-label={
                expanded
                    ? intl.formatMessage({ id: "group.collapse" }, { title: layerTitle })
                    : intl.formatMessage({ id: "group.expand" }, { title: layerTitle })
            }
            aria-expanded={expanded}
            aria-controls={layerGroupId}
            visibility={hasNestedChildren ? "visible" : "hidden"} //use visible:hidden for layers without children for correct indent
        />
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
            get className(): string {
                return getClassNameForLayer(layer);
            },
            setExpanded(expand: boolean, options?: ExpandLayerItemOptions) {
                expanded.value = expand;
                if (options && options.bubble) {
                    const parentLayer = layer.parent;
                    if (parentLayer) {
                        tocModel.getItem(parentLayer.id)?.setExpanded(expand);
                    }
                }
            }
        };
    }, [layer, options.initiallyCollapsed, tocModel]);

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

function getClassNameForLayer(layer: AnyLayer) {
    return `layer-${slug(layer.id)}`;
}
