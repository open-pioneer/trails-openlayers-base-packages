// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
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
import { Layer, AnyLayer, MapModel, Sublayer } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { FiAlertTriangle, FiMoreVertical } from "react-icons/fi";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

interface LayerListProps {
    map: MapModel;
    "aria-label"?: string;
    collapsibleGroups?: boolean;
}

export interface LayerListRef {
    /**
     * collapses all groups in the layer list
     */
    collapseAll: CollapseHandler;
}

/**
 * Lists the (top level) operational layers in the map.
 *
 * Layer Groups are skipped in the current implementation.
 */
export const LayerList = forwardRef<LayerListRef, LayerListProps>((props, ref) => {
    const { map, "aria-label": ariaLabel, collapsibleGroups = false} = props;
    const collapseHandlers = new Map<string, CollapseHandler>();
    const intl = useIntl();
    const layers = useLayers(map);
    useImperativeHandle(ref, () => ({
        collapseAll: () => {
            //collapse all groups
            for (const collapseHandler of collapseHandlers.values()) {
                collapseHandler();
            }
        }
    }));

    if (!layers.length) {
        return (
            <Text className="toc-missing-layers" aria-label={ariaLabel}>
                {intl.formatMessage({ id: "missingLayers" })}
            </Text>
        );
    }

    return createList(
        layers,
        intl,
        {
            "aria-label": ariaLabel
        },
        collapseHandlers,
        collapsibleGroups
    );
});
LayerList.displayName = "LayerList";

function createList(
    layers: AnyLayer[],
    intl: PackageIntl,
    listProps: ListProps,
    collapseHandlers: Map<string, CollapseHandler>,
    collapsibleGroups: boolean
) {
    const items = layers.map((layer) => {
        return (
            <LayerItem
                key={layer.id}
                layer={layer}
                intl={intl}
                collapseHandlers={collapseHandlers}
                isCollapsible={collapsibleGroups}
            />
        );
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
function LayerItem(props: {
    layer: AnyLayer;
    intl: PackageIntl;
    collapseHandlers: Map<string, CollapseHandler>;
    isCollapsible: boolean;
}): JSX.Element {
    const { layer, intl, collapseHandlers, isCollapsible } = props;
    const { title, description, isVisible } = useReactiveSnapshot(() => {
        return {
            title: layer.title,
            description: layer.description,
            isVisible: layer.visible
        };
    }, [layer]);
    const sublayers = useSublayers(layer);
    const isAvailable = useLoadState(layer) !== "error";
    const notAvailableLabel = intl.formatMessage({ id: "layerNotAvailable" });
    const [expanded, setExpanded] = useState(true);
    const collapseHandler = useCallback(() => setExpanded(false), []);

    let nestedChildren;
    if (sublayers?.length) {
        nestedChildren = createList(
            sublayers,
            intl,
            {
                ml: 4,
                "aria-label": intl.formatMessage({ id: "childgroupLabel" }, { title: title })
            },
            collapseHandlers,
            isCollapsible
        );
    }

    //add collapse handler for layer
    collapseHandlers.set(layer.id, collapseHandler);

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
                    onChange={(event) => layer.setVisible(event.target.checked)}
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
                        onClick={() => setExpanded(!expanded)}
                        icon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        aria-label={
                            expanded
                                ? intl.formatMessage({ id: "group.collapse" })
                                : intl.formatMessage({ id: "group.expand" })
                        }
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
            {nestedChildren && <Collapse in={expanded}>{nestedChildren}</Collapse>}
        </Box>
    );
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
 * Returns the sublayers of the given layer (or undefined, if the sublayer cannot have any).
 * Sublayers are returned in render order (topmost sublayer first).
 */
function useSublayers(layer: AnyLayer): Sublayer[] | undefined {
    return useReactiveSnapshot(() => {
        const sublayers = layer.sublayers?.getSublayers({ sortByDisplayOrder: true });
        if (!sublayers) {
            return undefined;
        }

        sublayers.reverse(); // render topmost layer first
        return sublayers;
    }, [layer]);
}

/** Returns the layers current state. */
function useLoadState(layer: AnyLayer): string {
    return useReactiveSnapshot(() => {
        // for sublayers, use the state of the parent
        const target = "parentLayer" in layer ? layer.parentLayer : layer;
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

type CollapseHandler = () => void;
