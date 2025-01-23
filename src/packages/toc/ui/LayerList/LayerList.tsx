// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { reactive } from "@conterra/reactivity-core";
import {
    Box,
    Button,
    Checkbox,
    Collapse,
    Flex,
    IconButton,
    List,
    ListProps,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Portal,
    Spacer,
    Text,
    Tooltip
} from "@open-pioneer/chakra-integration";
import { AnyLayer, Layer, MapModel, isSublayer } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, memo, useEffect, useId, useMemo } from "react";
import { FiAlertTriangle, FiMoreVertical } from "react-icons/fi";
import { useTocWidgetOptions } from "../../Context";
import { TocItem, useTocModel } from "../../model/TocModel";

interface LayerListProps {
    map: MapModel;

    /** The label of the list group (<ul>) */
    "aria-label"?: string;
}

/**
 * Lists the operational layers in the map.
 */
export const LayerList: FC<LayerListProps> = memo(function LayerList(props: LayerListProps) {
    const { map, "aria-label": ariaLabel } = props;
    const intl = useIntl();
    const layers = useLayers(map);

    if (!layers.length) {
        return (
            <Text className="toc-missing-layers" aria-label={ariaLabel}>
                {intl.formatMessage({ id: "missingLayers" })}
            </Text>
        );
    }

    return createList(layers, {
        "aria-label": ariaLabel
    });
});

function createList(layers: AnyLayer[], listProps: ListProps) {
    const items = layers.map((layer) => {
        return <LayerItem key={layer.id} layer={layer} />;
    });

    const list = (
        <Box>
            <List
                // Note: not using UnorderedList because it adds default margins
                as="ul"
                className="toc-layer-list"
                listStyleType="none"
                role="group"
                {...listProps}
            >
                {items}
            </List>
        </Box>
    );

    return list;
}

/**
 * Renders a single layer as a list item.
 *
 * The item may have further nested list items if there are sublayers present.
 */
function LayerItem(props: { layer: AnyLayer }): JSX.Element {
    const { layer } = props;
    const intl = useIntl();
    const options = useTocWidgetOptions();
    const tocModel = useTocModel();
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

    const isCollapsible = options ? options.collapsibleGroups : false;
    const isInitiallyCollapsed = options?.isCollapsed ?? true;
    const tocItem = useMemo((): TocItem => {
        const expanded = reactive(!isInitiallyCollapsed);
        return {
            layerId: layer.id,
            get isExpanded(): boolean {
                return expanded.value;
            },
            setExpanded(expand: boolean) {
                expanded.value = expand;
            }
        };
        // TODO: isCollapsed -> recreate model is ok?
    }, [layer, isInitiallyCollapsed]);
    useEffect(() => {
        tocModel.registerItem(tocItem);
        return () => tocModel.unregisterItem(tocItem);
    }, [tocModel, tocItem]);

    const expanded = useReactiveSnapshot(() => tocItem.isExpanded, [tocItem]);

    let nestedChildren;
    if (childLayers?.length) {
        nestedChildren = createList(childLayers, {
            ml: 4,
            "aria-label": intl.formatMessage({ id: "childgroupLabel" }, { title: title })
        });
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
                    <IconButton
                        variant="ghost"
                        borderRadius="full"
                        padding={0}
                        className="toc-layer-item-collapse-button"
                        onClick={() => tocItem.setExpanded(!expanded)}
                        icon={expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        aria-label={
                            expanded
                                ? intl.formatMessage({ id: "group.collapse" }, { title: title })
                                : intl.formatMessage({ id: "group.expand" }, { title: title })
                        }
                        aria-expanded={expanded}
                        aria-controls={layerGroupId}
                        visibility={nestedChildren ? "visible" : "hidden"} //use visible:hidden for layers without children for correct indent
                    />
                )}
                <Checkbox
                    // Keyboard navigation jumps only to Checkboxes and uses the texts inside this DOM node. The aria-labels of Tooltip and Icon is ignored by screenreader because they are no child element of the checkbox. To consider the notAvailableLabel, an aria-label at the checkbox is necessary.
                    aria-label={title + (!isAvailable ? " " + notAvailableLabel : "")}
                    isChecked={isVisible}
                    isDisabled={!isAvailable}
                    onChange={(event) =>
                        updateLayerVisibility(layer, event.target.checked, options.autoShowParents)
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
                <Spacer></Spacer>
                {description && (
                    <LayerItemDescriptor
                        layer={layer}
                        title={title}
                        description={description}
                        intl={intl}
                    />
                )}
            </Flex>
            {nestedChildren && (
                <Collapse in={expanded} id={layerGroupId} className="toc-collapsible-item">
                    {nestedChildren}
                </Collapse>
            )}
        </Box>
    );
}

function updateLayerVisibility(layer: AnyLayer, visible: boolean, autoShowParents: boolean) {
    layer.setVisible(visible);
    if (visible && autoShowParents && layer.parent) {
        updateLayerVisibility(layer.parent, true, true);
    }
}

function LayerItemDescriptor(props: {
    layer: AnyLayer;
    title: string;
    description: string;
    intl: PackageIntl;
}): JSX.Element {
    const { layer, title, description, intl } = props;
    const buttonLabel = intl.formatMessage({ id: "descriptionLabel" });
    const isAvailable = useLoadState(layer) !== "error";

    return (
        <Popover placement="bottom-start">
            <PopoverTrigger>
                <Button
                    isDisabled={!isAvailable}
                    className="toc-layer-item-details-button"
                    aria-label={buttonLabel}
                    borderRadius="full"
                    iconSpacing={0}
                    padding={0}
                    variant="ghost"
                    leftIcon={<FiMoreVertical />}
                />
            </PopoverTrigger>
            <Portal>
                <PopoverContent className="toc-layer-item-details" overflowY="auto" maxHeight="400">
                    <PopoverArrow />
                    <PopoverCloseButton mt={1} />
                    <PopoverHeader>{title}</PopoverHeader>
                    <PopoverBody>{description}</PopoverBody>
                </PopoverContent>
            </Portal>
        </Popover>
    );
}

/** Returns the top level operational layers in render order (topmost layer first). */
function useLayers(map: MapModel): Layer[] {
    return useReactiveSnapshot(() => {
        const layers = map.layers.getOperationalLayers({ sortByDisplayOrder: true }) ?? [];
        layers.reverse(); // render topmost layer first
        return layers;
    }, [map]);
}

/**
 * Returns the child layers (sublayers or layers contained in a group layer) of a layer.
 * Layers are returned in render order (topmost sublayer first).
 */
function useChildLayers(layer: AnyLayer): AnyLayer[] | undefined {
    return useReactiveSnapshot(() => {
        const children = layer.children?.getItems({ sortByDisplayOrder: true });
        children?.reverse(); // render topmost layer first
        return children;
    }, [layer]);
}

/** Returns the layers current state. */
function useLoadState(layer: AnyLayer): string {
    return useReactiveSnapshot(() => {
        // for sublayers, use the state of the parent
        const target = isSublayer(layer) ? layer.parentLayer : layer;
        return target.loadState;
    }, [layer]);
}

function slug(id: string) {
    return id
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
