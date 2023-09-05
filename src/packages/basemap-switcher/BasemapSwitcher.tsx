// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    FormLabel,
    BoxProps,
    Flex,
    Select,
    FormControl
} from "@open-pioneer/chakra-integration";
import { useMapModel, LayerCollection } from "@open-pioneer/map";
import { FC, ForwardedRef, forwardRef, RefAttributes, useEffect, useState } from "react";
import { useBasemapLayers } from "./hooks";
import classNames from "classnames";

/**
 * Optional configuration for deactivation from all base layers.
 */
export interface NoneBasemapConfig {
    /**
     * The id of the `noneBasemap` for the select option.
     */
    id: string;
    /**
     * The label of the `noneBasemap` for the select option.
     */
    label: string;
    /**
     * If `true`, the `noneBasemap` is selected initially.
     */
    selected: boolean;
}
/**
 * These are special properties for the `Select`.
 */
export interface SelectOptions {
    /**
     * The id of the basemap for the select option.
     */
    id: string;
    /**
     * The label of the basemap for the select option.
     */
    label: string;
    /**
     * If `true`, the basemap is visible and selected initially.
     */
    selected: boolean;
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
     * Optional config object, if none basemap option is set.
     */
    noneBasemap?: NoneBasemapConfig | undefined;

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
    const { mapId, className, noneBasemap, label, ...rest } = props;
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [value, setValue] = useState<string | undefined>();
    const [layerCollection, setLayerCollection] = useState<LayerCollection | undefined>(undefined);
    const [options, setOptions] = useState<SelectOptions[] | undefined>(undefined);
    const mapState = useMapModel(mapId);

    useBasemapLayers(value, layerCollection);

    useEffect(() => {
        if (mapState.kind !== "resolved") {
            return;
        }

        setIsLoading(false);

        const map = mapState.map;
        setLayerCollection(map?.layers);

        const { options, selected } = createOptions(map?.layers, noneBasemap);
        setOptions(options);
        setValue(selected?.label);
    }, [mapState, noneBasemap]);

    return (
        <Box className={classNames("basemap-switcher", className)} ref={ref} {...rest}>
            {!isLoading ? (
                <Flex gap={3} alignItems="center">
                    <FormControl>
                        <FormLabel className="basemap-switcher-label">{label}</FormLabel>
                        <Select
                            className="basemap-switcher-select"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        >
                            {options?.map((opt) => (
                                <option key={opt.id} value={opt.label}>
                                    {opt.label}
                                </option>
                            ))}
                        </Select>
                    </FormControl>
                </Flex>
            ) : (
                ""
            )}
        </Box>
    );
});

function createOptions(
    layerCollection: LayerCollection | undefined,
    noneBasemap: NoneBasemapConfig | undefined
) {
    const baseLayers = layerCollection?.getBaseLayers();

    const options = baseLayers?.map((item) => ({
        id: item.id,
        label: item.title,
        selected: item.visible
    }));

    if (noneBasemap) {
        options?.push(noneBasemap);
    }

    const selected = options?.find((opt) => opt.selected);
    return { options, selected };
}
