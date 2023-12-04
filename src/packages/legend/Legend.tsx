// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { Layer, MapModel, useMapModel, LayerBase } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { ComponentType, FC, ReactNode, useCallback, useRef, useSyncExternalStore } from "react";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import LayerGroup from "ol/layer/Group";

/*
    Exported for tests. Feels a bit hacky but should be fine for now.
    Originally was using the empty string, but that doesn't work well with happy-dom.
*/
export const NO_BASEMAP_ID = "___NO_BASEMAP___";

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
 * These are special properties for the BasemapSwitcher.
 */
export interface LegendProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Additional css class name(s) that will be added to the BasemapSwitcher component.
     */
    className?: string;
}

/**
 * The `BasemapSwitcher` component can be used in an app to switch between the different basemaps.
 */
export const Legend: FC<LegendProps> = (props) => {
    const intl = useIntl();
    const { mapId } = props;
    const { containerProps } = useCommonComponentProps("basemap-switcher", props);

    const { map } = useMapModel(mapId);
    const baseLayers = useBaseLayers(map);

    const activateBaseLayer = (layerId: string) => {
        map?.layers.activateBaseLayer(layerId === NO_BASEMAP_ID ? undefined : layerId);
    };

    const layers = useLayers(map);
    // Todo sind hier auch baselayer dabei?
    // todo wie wms sublayer beruecksichtigen
    /* if (!layers.length) {
        return (
            <Text className="toc-missing-layers" aria-labelledby={ariaLabelledBy}>
                {intl.formatMessage({ id: "missingLayers" })}
            </Text>
        );
    }*/

    // const Component = (attributes as any).component;

    // todo: filter only visible layer

    const components: ReactNode[] = layers.map((layer) => {
        const legendAttributes = layer.attributes["legend"] as LegendItemAttributes | undefined;

        let renderedComponent: ReactNode | undefined;
        if (legendAttributes?.Component) {
            renderedComponent = <legendAttributes.Component layer={layer} />;
        } else if (legendAttributes?.imageUrl) {
            renderedComponent = (
                <img src={legendAttributes?.imageUrl} alt="sljkdf" />
            ); /*todo alt text*/
        } else {
            // TODO: implement logic for #204 in own if else
            return undefined;
        }

        return renderedComponent;
    });

    return <Box {...containerProps}>{map ? components : ""}</Box>;
};

function useBaseLayers(mapModel: MapModel | undefined): Layer[] {
    // Caches potentially expensive layers arrays.
    // Not sure if this is a good idea, but getSnapshot() should always be fast.
    // If this is a no-go, make getAllLayers() fast instead.
    const baseLayers = useRef<Layer[] | undefined>();
    const subscribe = useCallback(
        (cb: () => void) => {
            // Reset cache when (re-) subscribing
            baseLayers.current = undefined;

            if (!mapModel) {
                return () => undefined;
            }
            const resource = mapModel.layers.on("changed", () => {
                // Reset cache content so getSnapshot() fetches basemaps again.
                baseLayers.current = undefined;
                cb();
            });
            return () => resource.destroy();
        },
        [mapModel]
    );
    const getSnapshot = useCallback(() => {
        if (baseLayers.current) {
            return baseLayers.current;
        }
        return (baseLayers.current = mapModel?.layers.getBaseLayers() ?? []);
    }, [mapModel]);
    return useSyncExternalStore(subscribe, getSnapshot);
}

// todo: refactor to map package
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
        let layers = map.layers.getOperationalLayers({ sortByDisplayOrder: true }) ?? [];
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
