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
    Text
} from "@open-pioneer/chakra-integration";
import { LayerBase, MapModel, Sublayer } from "@open-pioneer/map";
import { PackageIntl } from "@open-pioneer/runtime";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { useCallback, useRef, useSyncExternalStore } from "react";
import { FiAlertTriangle, FiMoreVertical } from "react-icons/fi";

type TocLayer = Layer | Sublayer;

/**
 * Lists the (top level) operational layers in the map.
 *
 * Layer Groups are skipped in the current implementation.
 */
export function LayerList(props: { map: MapModel; "aria-labelledby"?: string }): JSX.Element {
    const { map, "aria-labelledby": ariaLabelledBy } = props;
    const intl = useIntl();
    const layers = useLayers(map);
    if (!layers.length) {
        return (
            <Text className="toc-missing-layers" aria-labelledby={ariaLabelledBy}>
                {intl.formatMessage({ id: "missingLayers" })}
            </Text>
        );
    }

    return createList(layers, intl, {
        "aria-labelledby": ariaLabelledBy
    });
}

function createList(layers: TocLayer[], intl: PackageIntl, listProps: ListProps) {
    const items = layers.map((layer) => <LayerItem key={layer.id} layer={layer} intl={intl} />);
    return (
        <List
            // Note: not using UnorderedList because it adds default margins
            as="ul"
            className="toc-layer-list"
            listStyleType="none"
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
function LayerItem(props: { layer: TocLayer; intl: PackageIntl }): JSX.Element {
    const { layer, intl } = props;
    const title = useTitle(layer);
    const { isVisible, setVisible } = useVisibility(layer);
    const sublayers = useSublayers(layer);
    const isAvailable = useLoadState(layer) !== "error";

    let nestedChildren;
    if (sublayers?.length) {
        nestedChildren = createList(sublayers, intl, { ml: 4 });
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
                    isChecked={isVisible}
                    isDisabled={!isAvailable}
                    onChange={(event) => setVisible(event.target.checked)}
                >
                    {title}
                </Checkbox>
                {!isAvailable && (
                    // TODO Tooltip?
                    // TODO Aria Label
                    <FiAlertTriangle color={"red"} aria-label={"Layer nicht verfügbar"} />
                )}
                <Spacer></Spacer>
                {layer.description && (
                    <LayerItemDescriptor layer={layer} title={title} intl={intl} />
                )}
            </Flex>
            {nestedChildren}
        </Box>
    );
}

function LayerItemDescriptor(props: {
    layer: TocLayer;
    title: string;
    intl: PackageIntl;
}): JSX.Element {
    const { layer, title, intl } = props;
    const buttonLabel = intl.formatMessage({ id: "descriptionLabel" });
    const description = useLayerDescription(layer);
    const isAvailable = useLoadState(layer) !== "error";

    return (
        <Popover>
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
                    <PopoverCloseButton />
                    <PopoverHeader>{title}</PopoverHeader>
                    <PopoverBody>{description}</PopoverBody>
                </PopoverContent>
            </Portal>
        </Popover>
    );
}

function useLayerDescription(layer: LayerBase): string {
    const getSnapshot = useCallback(() => layer.description, [layer]);
    const subscribe = useCallback(
        (cb: () => void) => {
            const resource = layer.on("changed:description", cb);
            return () => resource.destroy();
        },
        [layer]
    );
    return useSyncExternalStore(subscribe, getSnapshot);
}

/** Returns the layers current title. */
function useTitle(layer: LayerBase): string {
    const getSnapshot = useCallback(() => layer.title, [layer]);
    const subscribe = useCallback(
        (cb: () => void) => {
            const resource = layer.on("changed:title", cb);
            return () => resource.destroy();
        },
        [layer]
    );

    return useSyncExternalStore(subscribe, getSnapshot);
}

/** Returns the layer's current visibility and a function to change it. */
function useVisibility(layer: LayerBase): {
    isVisible: boolean;
    setVisible(visible: boolean): void;
} {
    const getSnapshot = useCallback(() => layer.visible, [layer]);
    const subscribe = useCallback(
        (cb: () => void) => {
            const resource = layer.on("changed:visible", cb);
            return () => resource.destroy();
        },
        [layer]
    );
    const isVisible = useSyncExternalStore(subscribe, getSnapshot);
    const setVisible = useCallback(
        (visible: boolean) => {
            layer.setVisible(visible);
        },
        [layer]
    );

    return {
        isVisible,
        setVisible
    };
}

/** Returns the top level operation layers (without LayerGroups). */
function useLayers(map: MapModel): Layer[] {
    const subscribe = useCallback(
        (cb: () => void) => {
            const resource = map.layers.on("changed", cb);
            return () => resource.destroy();
        },
        [map]
    );
    const getValue = useCallback(() => {
        let layers = map.layers.getOperationalLayers({ sortByDisplayOrder: true }) ?? [];
        layers = layers.reverse();
        return layers;
    }, [map]);
    return useCachedExternalStore(subscribe, getValue);
}

/** Returns the sublayers of the given layer (or undefined, if the sublayer cannot have any). */
function useSublayers(layer: LayerBase): Sublayer[] | undefined {
    const subscribe = useCallback(
        (cb: () => void) => {
            const resource = layer.sublayers?.on("changed", cb);
            return () => resource?.destroy();
        },
        [layer]
    );
    const getValue = useCallback((): Sublayer[] | undefined => {
        const sublayers = layer.sublayers;
        if (!sublayers) {
            return undefined;
        }

        let layers = layer.sublayers?.getSublayers({ sortByDisplayOrder: true });
        layers = layers.reverse();
        return layers;
    }, [layer]);
    return useCachedExternalStore(subscribe, getValue);
}

/** Returns the layers current state. */
function useLoadState(layer: TocLayer): string {
    const subscribe = useCallback(
        (cb: () => void) => {
            const resource = layer.on("changed:loadState", cb);
            return () => resource.destroy();
        },
        [layer]
    );

    const getSnapshot = useCallback(() => {
        if ("loadState" in layer) {
            return layer.loadState;
        } else if ("parentLayer" in layer) {
            // for sublayers, use the state of the parent
            return layer.parentLayer.loadState;
        } else {
            return "loaded";
        }
    }, [layer]);

    return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * This hooks wraps an external store that does not cache its own values, i.e.
 * it may return a different value each time from `getValue()`.
 *
 * The results returned from `getValue()` are cached locally; the cache
 * is only invalidated on re-subscription or if a change event has been observed.
 */
function useCachedExternalStore<T>(
    subscribe: (onStoreChanged: () => void) => () => void,
    getValue: () => T
): T {
    const cachedValue = useRef<{ value: T } | undefined>();

    const cachedSubscribe = useCallback(
        (cb: () => void) => {
            const cleanup = subscribe(() => {
                // Reset cache on change
                cachedValue.current = undefined;
                cb();
            });
            return () => {
                // Reset cache when (re-) subscribing
                cachedValue.current = undefined;
                cleanup();
            };
        },
        [subscribe]
    );
    const cachedGetSnapshot = useCallback(() => {
        // Return cached values if still up to date (see resets above).
        if (cachedValue.current) {
            return cachedValue.current.value;
        }

        // Compute values and cache the result.
        const value = getValue();
        cachedValue.current = { value };
        return value;
    }, [getValue]);
    return useSyncExternalStore(cachedSubscribe, cachedGetSnapshot);
}

function slug(id: string) {
    return id
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
