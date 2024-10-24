// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Button,
    Checkbox,
    Flex,
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
import { FiAlertTriangle, FiMoreVertical } from "react-icons/fi";

/**
 * Lists the (top level) operational layers in the map.
 *
 * Layer Groups are skipped in the current implementation.
 */
export function LayerList(props: { map: MapModel; "aria-label"?: string }): JSX.Element {
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

    return createList(layers, intl, {
        "aria-label": ariaLabel
    });
}

function createList(layers: AnyLayer[], intl: PackageIntl, listProps: ListProps) {
    const items = layers.map((layer) => <LayerItem key={layer.id} layer={layer} intl={intl} />);
    return (
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
    );
}

/**
 * Renders a single layer as a list item.
 *
 * The item may have further nested list items if there are sublayers present.
 */
function LayerItem(props: { layer: AnyLayer; intl: PackageIntl }): JSX.Element {
    const { layer, intl } = props;
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

    let nestedChildren;
    if (sublayers?.length) {
        nestedChildren = createList(sublayers, intl, {
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
            {nestedChildren}
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
