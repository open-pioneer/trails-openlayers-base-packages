// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, FormControl, FormLabel, Select } from "@open-pioneer/chakra-integration";
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

const NO_BASEMAP_ID = "";

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
     * Optional config, if none basemap option is set.
     *
     * TODO: Different Name?
     */
    noneBasemap?: boolean;

    /**
     * Optional label for the `Select`.
     */
    label?: string;
}

/**
 * The `BasemapSwitcher` component can be used in an app to switch between the different basemaps.
 */
export const BasemapSwitcher: FC<BasemapSwitcherProps> = forwardRef(function BasemapSwitcher(
    props: BasemapSwitcherProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const intl = useIntl();
    const {
        mapId,
        className,
        noneBasemap,
        label = intl.formatMessage({ id: "defaultLabel" }),
        ...rest
    } = props;
    const noneBasemapLabel = intl.formatMessage({ id: "noneBasemapLabel" });

    const { map } = useMapModel(mapId);
    const baseLayers = useBaseLayers(map);
    const { selectOptions, selectedId } = useMemo(() => {
        return createOptions({ baseLayers, noneBasemap, noneBasemapLabel });
    }, [baseLayers, noneBasemap, noneBasemapLabel]);
    const activateLayer = (layerId: string) => {
        // empty string is used for "no basemap"
        map?.layers.activateBaseLayer(layerId === NO_BASEMAP_ID ? undefined : layerId);
    };

    return (
        <Box className={classNames("basemap-switcher", className)} ref={ref} {...rest}>
            {map ? (
                <FormControl display="flex" alignItems="center">
                    <FormLabel className="basemap-switcher-label">{label}</FormLabel>
                    <Select
                        className="basemap-switcher-select"
                        value={selectedId}
                        onChange={(e) => activateLayer(e.target.value)}
                        aria-label={label} /** TODO: Needed? Form label should be sufficient? */
                    >
                        {selectOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.label}
                            </option>
                        ))}
                    </Select>
                </FormControl>
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
    noneBasemap: boolean | undefined;
    noneBasemapLabel: string;
}): { selectOptions: SelectOption[]; selectedId: string } {
    const { baseLayers = [], noneBasemap = false, noneBasemapLabel } = params;
    const selectOptions: SelectOption[] = baseLayers.map((item) => ({
        id: item.id,
        label: item.title
    }));

    let selectedId = baseLayers.find((layer) => layer.visible)?.id;
    if (noneBasemap || selectedId == null) {
        selectOptions.push(getNonBaseMapConfig(noneBasemapLabel));
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
