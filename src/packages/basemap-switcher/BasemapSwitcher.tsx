// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Select } from "@open-pioneer/chakra-integration";
import { Layer, MapModel, useMapModel } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useCallback, useRef, useSyncExternalStore } from "react";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";

/*
    Exported for tests. Feels a bit hacky but should be fine for now.
    Originally was using the empty string, but that doesn't work well with happy-dom.
*/
export const NO_BASEMAP_ID = "___NO_BASEMAP___";

/**
 * These are special properties for the BasemapSwitcher.
 */
export interface BasemapSwitcherProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Additional css class name(s) that will be added to the BasemapSwitcher component.
     */
    className?: string;

    /**
     * Specifies whether an option to deactivate all basemap layers is available in the BasemapSwitcher.
     * Defaults to `false`.
     */
    allowSelectingEmptyBasemap?: boolean | undefined;

    /**
     * Optional aria-labelledby property.
     * Do not use together with aria-label.
     */
    "aria-labelledby"?: string;

    /**
     * Optional aria-label property.
     * Do not use together with aria-label.
     */
    "aria-label"?: string;
}

/**
 * The `BasemapSwitcher` component can be used in an app to switch between the different basemaps.
 */
export const BasemapSwitcher: FC<BasemapSwitcherProps> = (props) => {
    const intl = useIntl();
    const {
        mapId,
        allowSelectingEmptyBasemap = false,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy
    } = props;
    const { containerProps } = useCommonComponentProps("basemap-switcher", props);
    const emptyBasemapLabel = intl.formatMessage({ id: "emptyBasemapLabel" });

    const { map } = useMapModel(mapId);
    const baseLayers = useBaseLayers(map);
    const activateLayer = (layerId: string) => {
        map?.layers.activateBaseLayer(layerId === NO_BASEMAP_ID ? undefined : layerId);
    };

    const options = baseLayers.map((layer) => (
        <BasemapSelectOption key={layer.id} layer={layer} intl={intl} />
    ));

    let selectedId = baseLayers.find((layer) => layer.visible && layer.loadState !== "error")?.id;
    if (allowSelectingEmptyBasemap || selectedId == null) {
        options.push(<EmptyBasemapSelectOption key={NO_BASEMAP_ID} label={emptyBasemapLabel} />);
    }
    if (selectedId == null) {
        selectedId = NO_BASEMAP_ID;
    }

    return (
        <Box {...containerProps}>
            {map ? (
                <Select
                    aria-label={ariaLabel}
                    aria-labelledby={ariaLabelledBy}
                    className="basemap-switcher-select"
                    value={selectedId}
                    onChange={(e) => activateLayer(e.target.value)}
                >
                    {options}
                </Select>
            ) : (
                ""
            )}
        </Box>
    );
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

function BasemapSelectOption(props: { layer: Layer; intl: PackageIntl }): JSX.Element {
    const { layer, intl } = props;
    const layerId = layer.id;
    const label = useTitle(layer);
    const isAvailable = useLoadState(layer) !== "error";
    const tooltip = !isAvailable ? intl.formatMessage({ id: "layerNotAvailable" }) : "";

    return (
        <option value={layerId} disabled={!isAvailable} title={tooltip}>
            {label}
        </option>
    );
}

function EmptyBasemapSelectOption(props: { label: string }): JSX.Element {
    const { label } = props;

    return (
        <option value={NO_BASEMAP_ID} disabled={false} title={""}>
            {label}
        </option>
    );
}

function useTitle(layer: Layer): string {
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

function useLoadState(layer: Layer): string {
    const getSnapshot = useCallback(() => layer.loadState, [layer]);
    const subscribe = useCallback(
        (cb: () => void) => {
            const resource = layer.on("changed:loadState", cb);
            return () => resource.destroy();
        },
        [layer]
    );

    return useSyncExternalStore(subscribe, getSnapshot);
}
