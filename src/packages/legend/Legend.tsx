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
import LayerGroup from "ol/layer/Group";
import { useIntl } from "open-pioneer:react-hooks";
import { WarningTwoIcon } from "@chakra-ui/icons";
import classNames from "classnames";
import { PackageIntl } from "@open-pioneer/runtime";

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
 *
 * Example: TODO
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

// TODO: Tests

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
    // todo documentation: add hint that legend of sublayers is also shown but plain (without hierarchical structure)
    const legendListItems: ReactNode[] = layers.map((layer) => {
        return (
            // todo is it ok to use the same layer id as key like in the inner box component
            <LegendItem key={layer.id} layer={layer} showBaseLayers={showBaseLayers}></LegendItem>
        );
    });

    return (
        /*TODO: listProps: aria-labelledby ? */
        <List
            // Note: not using UnorderedList because it adds default margins
            as="ul"
            className="legend-layer-list"
            listStyleType="none"
        >
            {legendListItems}
        </List>
    );
}

function LegendItem(props: {
    layer: LegendLayer;
    showBaseLayers: boolean;
}): ReactNode | ReactNode[] {
    const intl = useIntl();

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

    const legendItems: ReactNode[] = [];

    // legend item for this layer
    legendItems.push(LegendContent(layer, intl));

    // legend items for all sublayers
    if (sublayers?.length) {
        sublayers.forEach((sublayer) => {
            legendItems.push(
                <LegendItem key={sublayer.id} layer={sublayer} showBaseLayers={showBaseLayers} />
            );
        });
    }

    return legendItems;
}

function LegendContent(layer: LegendLayer, intl: PackageIntl) {
    const legendAttributes = useLegendAttributes(layer.attributes);
    let renderedComponent: ReactNode | undefined;

    if (legendAttributes?.Component) {
        renderedComponent = <legendAttributes.Component layer={layer} />;
    } else if (legendAttributes?.imageUrl) {
        renderedComponent = (
            <LegendBox intl={intl} layer={layer} legendAttributes={legendAttributes} />
        );
    } else {
        // TODO: implement logic for #204 in own if else
        renderedComponent = undefined;
    }

    return renderedComponent ? (
        <Box key={layer.id} pb={2} className={classNames("legend-item", `layer-${slug(layer.id)}`)}>
            {renderedComponent}
        </Box>
    ) : (
        renderedComponent
    );
}

function LegendBox(props: {
    intl: PackageIntl;
    layer: LegendLayer;
    legendAttributes: LegendItemAttributes | undefined;
}) {
    const { intl, layer, legendAttributes } = props;
    const isBaseLayer = !("parentLayer" in layer) && layer.isBaseLayer;

    return (
        <Box>
            {/* Render additional text, if layer is a configured basemap */}
            {isBaseLayer && <Text as="b">{intl.formatMessage({ id: "basemapLabel" })}</Text>}

            <Text>{layer.title}</Text>
            <Image
                src={legendAttributes?.imageUrl}
                alt={intl.formatMessage({ id: "altLabel" }, { layerName: layer.title })}
                className={"legend-item__image"}
                // TODO: test fallback with NVDA
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

// todo: refactor to map package? (!this works with getAllLayers instead of getOperationalLayers)
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
        layers = layers.reverse().filter(canShowLegendForLayer);
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

function canShowLegendForLayer(layer: Layer) {
    return !(layer.olLayer instanceof LayerGroup);
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

function useLegendAttributes(layerAttributes: Record<string | symbol, unknown>) {
    const [legendAttributes, setLegendAttributes] = useState<LegendItemAttributes | undefined>();

    useEffect(() => {
        setLegendAttributes(layerAttributes.legend as LegendItemAttributes | undefined);
    }, [layerAttributes]);

    // layer.attributes["legend"] as LegendItemAttributes | undefined;

    return legendAttributes;
}

function slug(id: string) {
    return id
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
