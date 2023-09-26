// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, Select } from "@open-pioneer/chakra-integration";
import { LayerModel, MapModel, useMapModel } from "@open-pioneer/map";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import {
    FC,
    ForwardedRef,
    RefAttributes,
    forwardRef,
    useCallback,
    useMemo,
    useRef,
    useSyncExternalStore
} from "react";

/*
    Exported for tests. Feels a bit hacky but should be fine for now.
    Originally was using the empty string, but that doesn't work well with happy-dom.
*/
export const NO_BASEMAP_ID = "___NO_BASEMAP___";

/**
 * These are special properties for the `Select`.
 */
interface SelectOption {
    /**
     * The id of the basemap for the select option.
     */
    id: string;
    /**
     * The label of the basemap for the select option.
     */
    label: string;
}

/**
 * These are special properties for the BasemapSwitcher.
 */
export interface BasemapSwitcherProps extends BoxProps, RefAttributes<HTMLDivElement> {
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
     * Defaults to false.
     */
    allowSelectingEmptyBasemap?: boolean;
}

/**
 * The `BasemapSwitcher` component can be used in an app to switch between the different basemaps.
 */
export const BasemapSwitcher: FC<BasemapSwitcherProps> = forwardRef(function BasemapSwitcher(
    props: BasemapSwitcherProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const intl = useIntl();
    const { mapId, className, allowSelectingEmptyBasemap, ...rest } = props;
    const emptyBasemapLabel = intl.formatMessage({ id: "emptyBasemapLabel" });

    const { map } = useMapModel(mapId);
    const baseLayers = useBaseLayers(map);
    const { selectOptions, selectedId } = useMemo(() => {
        return createOptions({ baseLayers, allowSelectingEmptyBasemap, emptyBasemapLabel });
    }, [baseLayers, allowSelectingEmptyBasemap, emptyBasemapLabel]);
    const activateLayer = (layerId: string) => {
        // empty string is used for "no basemap"
        map?.layers.activateBaseLayer(layerId === NO_BASEMAP_ID ? undefined : layerId);
    };

    return (
        <Box className={classNames("basemap-switcher", className)} ref={ref} {...rest}>
            {map ? (
                <Select
                    className="basemap-switcher-select"
                    value={selectedId}
                    onChange={(e) => activateLayer(e.target.value)}
                >
                    {selectOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                            {opt.label}
                        </option>
                    ))}
                </Select>
            ) : (
                ""
            )}
        </Box>
    );
});

function useBaseLayers(mapModel: MapModel | undefined): LayerModel[] {
    // Caches potentially expensive layers arrays.
    // Not sure if this is a good idea, but getSnapshot() should always be fast.
    // If this is a no-go, make getAllLayers() fast instead.
    const baseLayers = useRef<LayerModel[] | undefined>();
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

function createOptions(params: {
    baseLayers: LayerModel[];
    allowSelectingEmptyBasemap: boolean | undefined;
    emptyBasemapLabel: string;
}): { selectOptions: SelectOption[]; selectedId: string } {
    const { baseLayers = [], allowSelectingEmptyBasemap = false, emptyBasemapLabel } = params;
    const selectOptions: SelectOption[] = baseLayers.map((item) => ({
        id: item.id,
        label: item.title
    }));

    let selectedId = baseLayers.find((layer) => layer.visible)?.id;
    if (allowSelectingEmptyBasemap || selectedId == null) {
        selectOptions.push(getNonBaseMapConfig(emptyBasemapLabel));
    }
    if (selectedId == null) {
        selectedId = NO_BASEMAP_ID;
    }
    return { selectOptions, selectedId };
}

function getNonBaseMapConfig(label: string) {
    return {
        id: NO_BASEMAP_ID,
        label
    };
}
