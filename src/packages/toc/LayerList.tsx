// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Checkbox, List, ListItem, Text } from "@open-pioneer/chakra-integration";
import { LayerModel, MapModel } from "@open-pioneer/map";
import LayerGroup from "ol/layer/Group";
import { useCallback, useRef, useSyncExternalStore } from "react";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";

/**
 * Lists the (top level) operational layers in the map.
 *
 * Layer Groups are skipped in the current implementation.
 */
export function LayerList(props: { map: MapModel }): JSX.Element {
    const { map } = props;
    const intl = useIntl();
    const layers = useLayers(map);
    const layerItems = layers.map((layer) => <LayerItem key={layer.id} layer={layer} />);

    if (!layerItems.length) {
        return (
            <Text className="toc-missing-layers">
                {intl.formatMessage({ id: "missingLayers" })}
            </Text>
        );
    }

    return (
        <List
            // Note: not using OrderedList because it adds default margins
            as="ol"
            className="layer-list"
            listStyleType="none"
        >
            {layerItems}
        </List>
    );
}

/** Renders a single layer as a list item. */
function LayerItem(props: { layer: LayerModel }): JSX.Element {
    const { layer } = props;
    const title = useTitle(layer);
    const { isVisible, setVisible } = useVisibility(layer);

    return (
        <ListItem className={classNames("layer-list-entry", `layer-${slug(layer.id)}`)}>
            <Checkbox isChecked={isVisible} onChange={(event) => setVisible(event.target.checked)}>
                {title}
            </Checkbox>
        </ListItem>
    );
}

/** Returns the layers current title. */
function useTitle(layer: LayerModel): string {
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
function useVisibility(layer: LayerModel): {
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
function useLayers(map: MapModel): LayerModel[] {
    // Caches potentially expensive layers arrays.
    // Not sure if this is a good idea, but getSnapshot() should always be fast.
    // If this is a no-go, make getAllLayers() fast instead.
    const flatOperationalLayers = useRef<LayerModel[] | undefined>();
    const subscribe = useCallback(
        (cb: () => void) => {
            // Reset cache when (re-) subscribing
            flatOperationalLayers.current = undefined;
            const resource = map.layers.on("changed", () => {
                // Reset cache content so getSnapshot() fetches layers again.
                flatOperationalLayers.current = undefined;
                cb();
            });
            return () => resource.destroy();
        },
        [map]
    );
    const getSnapshot = useCallback(() => {
        // Return cached values if still up to date (see resets above).
        if (flatOperationalLayers.current) {
            return flatOperationalLayers.current;
        }

        // Compute values and cache the result.
        let layers = map?.layers.getOperationalLayers({ sortByDisplayOrder: true }) ?? [];
        layers = layers.reverse().filter(canShowOperationalLayer);
        return (flatOperationalLayers.current = layers);
    }, [map]);
    return useSyncExternalStore(subscribe, getSnapshot);
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
