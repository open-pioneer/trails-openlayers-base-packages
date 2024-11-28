// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
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
import { useEvent } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import {
    createContext,
    forwardRef,
    useContext,
    useEffect,
    useId,
    useImperativeHandle,
    useMemo,
    useRef,
    useState
} from "react";
import { FiAlertTriangle, FiMoreVertical } from "react-icons/fi";
import { useTocWidgetOptions } from "./Context";


export interface LayerListRef {
    /**
     * state of all layer list items
     */
    readonly listItemsExpandedModel: ListItemsExpandedModel;
}

interface LayerListProps {
    map: MapModel;
    "aria-label"?: string;
}

interface LayerListCollapseContext {
    registerExpandedState(id: string, handler: ListItemExpandedState): void;
    unregisterExpandedState(id: string): void;
}

const LayerListContext = createContext<LayerListCollapseContext | undefined>(undefined);

/**
 * Lists the (top level) operational layers in the map.
 *
 * Layer Groups are skipped in the current implementation.
 */
export const LayerList = forwardRef<LayerListRef, LayerListProps>((props, ref) => {
    const { map, "aria-label": ariaLabel } = props;

    const expandedStates = useRef<Map<string, ListItemExpandedState>>();
    if (!expandedStates.current) {
        expandedStates.current = new Map();
    }

    const context = useMemo((): LayerListCollapseContext => {
        return {
            registerExpandedState(id: string, state: ListItemExpandedState) {
                expandedStates.current!.set(id, state);
            },
            unregisterExpandedState(id: string) {
                expandedStates.current!.delete(id);
            }
        };
    }, []);

    const expandedModel = useLayerItemsExpandedModel(expandedStates.current);

    const intl = useIntl();
    const layers = useLayers(map);
    useImperativeHandle(ref, () => ({ listItemsExpandedModel: expandedModel }));

    if (!layers.length) {
        return (
            <Text className="toc-missing-layers" aria-label={ariaLabel}>
                {intl.formatMessage({ id: "missingLayers" })}
            </Text>
        );
    }

    return (
        <LayerListContext.Provider value={context}>
            {createList(layers, {
                "aria-label": ariaLabel
            })}
        </LayerListContext.Provider>
    );
});
LayerList.displayName = "LayerList";

function createList(layers: AnyLayer[], listProps: ListProps) {
    const items = layers.map((layer) => {
        return <LayerItem key={layer.id} layer={layer}/>;
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
    const layerGroupId = useId();
    const { title, description, isVisible } = useReactiveSnapshot(() => {
        return {
            title: layer.title,
            description: layer.description,
            isVisible: layer.visible
        };
    }, [layer]);
    const childLayers = useChildLayers(layer);
    const isAvailable = useLoadState(layer) !== "error";
    const notAvailableLabel = intl.formatMessage({ id: "layerNotAvailable" });
    const [expanded, setExpanded] = useState(true);
    const context = useContext(LayerListContext);
    const isCollapsible = options ? options.collapsibleGroups : false;
    const expandedSetter = useEvent((expand: boolean) => {
        setExpanded(expand);
    });
    useEffect(() => {
        if (!context) {
            return;
        }

        context.registerExpandedState(layer.id, {
            layerId: layer.id,
            isExpanded: expanded,
            setExpanded: expandedSetter
        });
        return () => context.unregisterExpandedState(layer.id);
    }, [layer, context, expandedSetter, expanded]);

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
                {nestedChildren && isCollapsible && (
                    <IconButton
                        variant="ghost"
                        borderRadius="full"
                        padding={0}
                        className="toc-layer-item-collapse-button"
                        onClick={() => setExpanded(!expanded)}
                        icon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        aria-label={
                            expanded
                                ? intl.formatMessage({ id: "group.collapse"}, {title: title})
                                : intl.formatMessage({ id: "group.expand" }, {title: title})
                        }
                        aria-expanded={expanded}
                        aria-controls={layerGroupId}
                    />
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
            {nestedChildren && <Collapse in={expanded} id={layerGroupId}>{nestedChildren}</Collapse>}
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

function useLayerItemsExpandedModel(expandedStates: Map<string, ListItemExpandedState>) {
    const expandedModel = useMemo((): ListItemsExpandedModel => {
        return {
            isExpanded(layerId: string) {
                if (expandedStates.has(layerId)) {
                    return expandedStates.get(layerId)?.isExpanded;
                } else {
                    return undefined;
                }
            },
            setExpanded(layerId: string, expand: boolean) {
                expandedStates.get(layerId)?.setExpanded(expand);
            },
            getAllExpandedStates() {
                return Array.from(expandedStates.values());
            }
        };
    }, [expandedStates]);

    return expandedModel;
}

/**
 * setter function used to control wether a layer list item should be expanded or collapsed 
 */
export type ListItemExpandedSetter = (expand: boolean) => void;

/**
 * manages the expanded state  of a single layer list item
 */
export interface ListItemExpandedState {
    /**
     * identifier of the layer that corresponds with the list item
     */
    readonly layerId: string;
    /**
     * true if list item is expanded
     */
    readonly isExpanded: boolean;
    /**
     * setter function to expand or collapse the list item
     */
    readonly setExpanded: ListItemExpandedSetter;
}

/**
 * provides access to each layer list item's expanded state
 */
export interface ListItemsExpandedModel {
    readonly setExpanded: (layerId: string, expand: boolean) => void;
    readonly isExpanded: (layerId: string) => boolean | undefined;
    readonly getAllExpandedStates: () => ListItemExpandedState[];
}
