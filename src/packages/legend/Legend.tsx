// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Image, Text } from "@open-pioneer/chakra-integration";
import { Layer, MapModel, useMapModel, LayerBase } from "@open-pioneer/map";
import { ComponentType, FC, ReactNode, useCallback, useRef, useSyncExternalStore } from "react";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import LayerGroup from "ol/layer/Group";
import { v4 as uuid4v } from "uuid";
import { useIntl } from "open-pioneer:react-hooks";

/**
 * Properties of a legend item React component.
 */
export interface LegendItemComponentProps {
    layer: LayerBase;
}

/**
 * Attributes of the legend attribute that can be specified on a layer.
 *
 * Example: TODO
 */
export interface LegendItemAttributes {
    imageUrl?: string;
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
     * Additional css class name(s) that will be added to the Legend component.
     */
    className?: string;
}

// TODO: Tests

/**
 * The `Legend` component can be used to display the legend of layers that are visible in the map.
 */
export const Legend: FC<LegendProps> = (props) => {
    const { mapId } = props;
    const { containerProps } = useCommonComponentProps("legend", props);

    const { map } = useMapModel(mapId);

    return (
        /* TODO: make maxHeight configurable? */
        <Box overflowY="auto" maxHeight="400" {...containerProps}>
            {map ? <LegendItems map={map} /> : ""}
        </Box>
    );
};

function LegendItems(props: { map: MapModel }): ReactNode[] {
    const { map } = props;

    // todo baselayer is shown at the bottom of the legend: ok?
    const layers = useLayers(map);
    // todo documentation: add hint that legend of sublayers is also shown but plain (without hierarchical structure)
    const components: ReactNode[] = layers.map((layer) => {
        const id = uuid4v();
        // todo is it ok to always return a LegendItem even if it is undefined?
        const test = <LegendItem key={id} layer={layer}></LegendItem>;
        return test;
    });

    return components;
}

function LegendItem(props: { layer: LayerBase }): ReactNode {
    const intl = useIntl();

    const { layer } = props;
    const { isVisible } = useVisibility(layer);
    if (!isVisible) {
        return undefined;
    }

    const legendAttributes = layer.attributes["legend"] as LegendItemAttributes | undefined;
    let renderedComponent: ReactNode | undefined;
    if (legendAttributes?.Component) {
        renderedComponent = <legendAttributes.Component layer={layer} />;
    } else if (legendAttributes?.imageUrl) {
        renderedComponent = (
            <Box>
                <Text>{layer.title}</Text>
                <Image
                    src={legendAttributes?.imageUrl}
                    alt={intl.formatMessage({ id: "altLabel" }) + layer.title}
                    // todo: add fallbackSrc
                />
            </Box>
        );
    } else {
        // TODO: implement logic for #204 in own if else
        renderedComponent = undefined;
    }
    return renderedComponent;
}

// todo: refactor to map package? (!this works with getAllLayers instead of getOperationalLayers)
/** Returns the top level operation layers (without LayerGroups). */
function useLayers(map: MapModel): LayerBase[] {
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
