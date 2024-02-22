// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Image, List, Text } from "@open-pioneer/chakra-integration";
import { Layer, MapModel, useMapModel, LayerBase, Sublayer } from "@open-pioneer/map";
import {
    ComponentType,
    FC,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore
} from "react";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { WarningTwoIcon } from "@chakra-ui/icons";
import classNames from "classnames";

type LegendLayer = Layer | Sublayer;

/**
 * Properties of a legend item React component.
 */
export interface LegendItemComponentProps {
    /**
     * Related layer of the legend.
     */
    layer: LayerBase;
}

/**
 * Attributes of the legend attribute that can be specified on a layer.
 *
 * To show a legend for the layer, provide an imageUrl to an image to show
 * or provide a React component that will be rendered as a legend.
 */
export interface LegendItemAttributes {
    /**
     * (Optional) URL to an image that will be shown as a legend for the layer.
     */
    imageUrl?: string;

    /**
     * (Optional) React component that will be shown as customized legend for the layer.
     */
    Component?: ComponentType<LegendItemComponentProps>;
}

/**
 * These are special properties for the Legend.
 */
export interface LegendProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Specifies whether legend for active base layer is shown in the legend UI.
     * Defaults to `false`.
     */
    showBaseLayers?: boolean;
}

/**
 * The `Legend` component can be used to display the legend of layers that are visible in the map.
 */
export const Legend: FC<LegendProps> = (props) => {
    const { mapId, showBaseLayers = false } = props;
    const { containerProps } = useCommonComponentProps("legend", props);
    const { map } = useMapModel(mapId);

    return (
        <Box {...containerProps}>
            {map ? <LegendList map={map} showBaseLayers={showBaseLayers} /> : null}
        </Box>
    );
};

function LegendList(props: { map: MapModel; showBaseLayers: boolean }): JSX.Element {
    const { map, showBaseLayers } = props;

    const layers = useLayers(map);
    const legendListItems: ReactNode[] = layers.map((layer) => {
        return (
            <LegendItem key={layer.id} layer={layer} showBaseLayers={showBaseLayers}></LegendItem>
        );
    });

    return (
        <List
            // Note: not using UnorderedList because it adds default margins
            as="ul"
            className="legend-layer-list"
            listStyleType="none"
            spacing={2}
        >
            {legendListItems}
        </List>
    );
}

function LegendItem(props: { layer: LegendLayer; showBaseLayers: boolean }): ReactNode {
    const { layer, showBaseLayers } = props;
    const { isVisible } = useVisibility(layer);
    const sublayers = useSublayers(layer);

    if (!isVisible) {
        return undefined;
    }

    // '!("parentLayer" in layer)' checks if the layer is no sublayer
    if (!showBaseLayers && !("parentLayer" in layer) && layer.isBaseLayer) {
        return undefined;
    }

    // legend items for all sublayers
    const childItems: ReactNode[] = [];
    if (sublayers?.length) {
        sublayers.forEach((sublayer) => {
            childItems.push(
                <LegendItem key={sublayer.id} layer={sublayer} showBaseLayers={showBaseLayers} />
            );
        });
    }

    return (
        <>
            <LegendContent layer={layer} showBaseLayers={showBaseLayers} />
            {childItems}
        </>
    );
}

function LegendContent(props: { layer: LegendLayer; showBaseLayers: boolean }) {
    const intl = useIntl();

    const { layer, showBaseLayers } = props;
    const legendAttributes = useLegendAttributes(layer);
    const legendUrl = useLegend(layer);
    let renderedComponent: ReactNode | undefined;

    if (legendAttributes?.Component) {
        renderedComponent = <legendAttributes.Component layer={layer} />;
    } else if (legendAttributes?.imageUrl) {
        renderedComponent = <LegendImage layer={layer} imageUrl={legendAttributes.imageUrl} />;
    } else {
        if (legendUrl) {
            renderedComponent = <LegendImage layer={layer} imageUrl={legendUrl} />;
        }
    }

    const isBaseLayer = !("parentLayer" in layer) && layer.isBaseLayer;

    return renderedComponent ? (
        <Box as="li" className={classNames("legend-item", `layer-${slug(layer.id)}`)}>
            {showBaseLayers && isBaseLayer ? (
                /* Render additional text, if layer is a configured basemap */
                <Text as="b">{intl.formatMessage({ id: "basemapLabel" })}</Text>
            ) : null}
            {renderedComponent}
        </Box>
    ) : undefined;
}

function LegendImage(props: { imageUrl: string; layer: LegendLayer }) {
    const intl = useIntl();

    const { layer, imageUrl } = props;

    return (
        <Box>
            <Text>{layer.title}</Text>
            <Image
                maxW="none"
                maxH="none"
                src={imageUrl}
                alt={intl.formatMessage({ id: "altLabel" }, { layerName: layer.title })}
                className={"legend-item__image"}
                fallbackStrategy={"onError"}
                fallback={
                    <Box>
                        <Text>
                            <WarningTwoIcon me={2} />
                            {intl.formatMessage({ id: "fallbackLabel" })}
                        </Text>
                    </Box>
                }
            />
        </Box>
    );
}

function useLegend(layer: LayerBase): string | undefined {
    const getSnapshot = useCallback(() => layer.legend, [layer]);
    const subscribe = useCallback(
        (cb: () => void) => {
            const resource = layer.on("changed:legend", cb);
            return () => resource.destroy();
        },
        [layer]
    );

    return useSyncExternalStore(subscribe, getSnapshot);
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
        let layers = map.layers.getAllLayers({ sortByDisplayOrder: true }) ?? [];
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

/** Returns the layer's current visibility. */
function useVisibility(layer: LayerBase): {
    isVisible: boolean;
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

    return {
        isVisible
    };
}

function useLegendAttributes(layer: LayerBase) {
    const [legendAttributes, setLegendAttributes] = useState<LegendItemAttributes | undefined>(
        undefined
    );

    useEffect(() => {
        setLegendAttributes(layer.attributes.legend as LegendItemAttributes | undefined);

        const resource = layer.on("changed:attributes", () => {
            setLegendAttributes(layer.attributes.legend as LegendItemAttributes | undefined);
        });
        return () => resource.destroy();
    }, [layer]);

    return legendAttributes;
}

function slug(id: string) {
    return id
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
