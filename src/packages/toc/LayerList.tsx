// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Checkbox, List, ListItem, ListProps, Text } from "@open-pioneer/chakra-integration";
import { LayerModel, LayerModelBase, MapModel, SublayerModel } from "@open-pioneer/map";
import classNames from "classnames";
import LayerGroup from "ol/layer/Group";
import { useIntl } from "open-pioneer:react-hooks";
import { useCallback, useRef, useSyncExternalStore } from "react";

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

    return createList(layers, {
        "aria-labelledby": ariaLabelledBy
    });
}

function createList(layers: LayerModelBase[], listProps: ListProps) {
    const items = layers.map((layer) => <LayerItem key={layer.id} layer={layer} />);
    return (
        <List
            // Note: not using OrderedList because it adds default margins
            as="ol"
            className="toc-layer-list"
            listStyleType="none"
            {...listProps}
        >
            {items}
        </List>
    );
}

/** Renders a single layer as a list item. */
function LayerItem(props: { layer: LayerModelBase }): JSX.Element {
    const { layer } = props;
    const title = useTitle(layer);
    const { isVisible, setVisible } = useVisibility(layer);
    const sublayers = useSublayers(layer);

    let nestedChildren;
    if (sublayers?.length) {
        nestedChildren = createList(sublayers, { ml: 2 });
    }

    return (
        <ListItem className={classNames("toc-layer-list-entry", `layer-${slug(layer.id)}`)}>
            <Checkbox isChecked={isVisible} onChange={(event) => setVisible(event.target.checked)}>
                {title}
            </Checkbox>
            {nestedChildren}
        </ListItem>
    );
}

/** Returns the layers current title. */
function useTitle(layer: LayerModelBase): string {
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
function useVisibility(layer: LayerModelBase): {
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
function useLayers(map: MapModel): LayerModelBase[] {
    const subscribe = useCallback(
        (cb: () => void) => {
            const resource = map.layers.on("changed", cb);
            return () => resource.destroy();
        },
        [map]
    );
    const getValue = useCallback(() => {
        let layers = map.layers.getOperationalLayers({ sortByDisplayOrder: true }) ?? [];
        layers = layers.reverse().filter(canShowOperationalLayer);
        return layers;
    }, [map]);
    return useCachedExternalStore(subscribe, getValue);
}

/** Returns the sublayers of the given layer (or undefined, if the sublayer cannot have any). */
function useSublayers(layer: LayerModelBase): SublayerModel[] | undefined {
    const subscribe = useCallback(
        (cb: () => void) => {
            const resource = layer.sublayers?.on("changed", cb);
            return () => resource?.destroy();
        },
        [layer]
    );
    const getValue = useCallback((): SublayerModel[] | undefined => {
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

function canShowOperationalLayer(layerModel: LayerModel) {
    return !(layerModel.olLayer instanceof LayerGroup);
}

function slug(id: string) {
    return id
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
