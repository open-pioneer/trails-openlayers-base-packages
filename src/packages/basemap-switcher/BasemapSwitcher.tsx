// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Text, BoxProps, Flex, Select } from "@open-pioneer/chakra-integration";
import { useMapModel, LayerCollection } from "@open-pioneer/map";
import { FC, ForwardedRef, forwardRef, RefAttributes, useEffect, useState } from "react";

import { useBasemapLayers } from "./hooks";
import classNames from "classnames";

/**
 * Optional configuration for deactivation from all base layers.
 */
interface NoneBasemapConfig {
    id: string;
    label: string;
    selected: boolean;
}
/**
 * These are special properties for the Select.
 */
interface SelectOptions {
    id: string;
    label: string;
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
     * The config object if none basemap option is settet
     */
    noneBasemap?: NoneBasemapConfig | undefined;

    /**
     * optional label for the select
     */
    label?: string;
}

/**
 * The `BasemapSwitcher`component can be used in an app to switch between the diffrent basemaps.
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
    const state = useMapModel(mapId);
    useBasemapLayers(value, layerCollection);

    useEffect(() => {
        if (state.kind !== "resolved") {
            return;
        }
        setIsLoading(false);
        const map = state.map;
        setLayerCollection(map?.layers);
        const { options, selected } = createOptions(map?.layers, noneBasemap);
        setOptions(options);
        setValue(selected?.label);
    }, [state, noneBasemap]);

    return (
        <Box className={classNames("basemap-switcher", className)} ref={ref} {...rest}>
            {!isLoading ? (
                <Flex gap={3} alignItems="center">
                    <Text as="b">{label}</Text>
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
                </Flex>
            ) : (
                ""
            )}
        </Box>
    );
});

function createOptions(
    mapLayers: LayerCollection | undefined,
    noneBasemap: NoneBasemapConfig | undefined
) {
    const baseLayers = mapLayers?.getBaseLayers();
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
