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
import { useIntl } from "open-pioneer:react-hooks";
import { useMapModel, LayerCollection, LayerModel } from "@open-pioneer/map";
import { FC, ForwardedRef, forwardRef, RefAttributes, useEffect, useState } from "react";
import { useBasemapLayers } from "./hooks";
import classNames from "classnames";

/**
 * These are special properties for the `Select`.
 */
interface SelectOptions {
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
 * TODO:
 * - Was passiert, wenn keine Basemap auf visible gesetzt ist (Standardmäßig "ohne Hintergrundkarte" auswählen?) --> Implementieren!
 * - Watcher, wenn neue Basemaps hinzugefügt werden
 */

/**
 * The `BasemapSwitcher` component can be used in an app to switch between the different basemaps.
 */
export const BasemapSwitcher: FC<BasemapSwitcherProps> = forwardRef(function BasemapSwitcher(
    props: BasemapSwitcherProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const { mapId, className, noneBasemap, label, ...rest } = props;
    const [layerId, setLayerId] = useState<string | undefined>();
    const [layerCollection, setLayerCollection] = useState<LayerCollection | undefined>(undefined);
    const [options, setOptions] = useState<SelectOptions[] | undefined>(undefined);
    const { map } = useMapModel(mapId);

    const intl = useIntl();
    const noneBasemapLabel = intl.formatMessage({ id: "noneBasemapLabel" });

    useBasemapLayers(layerId, layerCollection);

    useEffect(() => {
        if (!map) {
            return;
        }
        setLayerCollection(map?.layers);
        const baseLayers = map?.layers.getBaseLayers();
        const { options } = createOptions(baseLayers, noneBasemap, noneBasemapLabel);
        const selected = options?.find((opt) => opt.selected);

        setOptions(options);
        setLayerId(selected?.label);
    }, [map, noneBasemap, noneBasemapLabel]);

    return (
        <Box className={classNames("basemap-switcher", className)} ref={ref} {...rest}>
            {layerCollection ? (
                <FormControl display="flex" alignItems="center">
                    <FormLabel className="basemap-switcher-label">{label}</FormLabel>
                    <Select
                        className="basemap-switcher-select"
                        value={layerId}
                        onChange={(e) => setLayerId(e.target.value)}
                        aria-label={label}
                    >
                        {options?.map((opt) => (
                            <option key={opt.id} value={opt.label}>
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

function createOptions(
    baseLayers: LayerModel[] | undefined,
    noneBasemap: boolean | undefined,
    noneBasemapLabel: string
) {
    const options = baseLayers?.map((item) => ({
        id: item.id,
        label: item.title,
        selected: item.visible
    }));
    const isActiveBaseLayer = options?.some((opt) => opt.selected);
    if (noneBasemap || !isActiveBaseLayer) {
        options?.push(getNonBaseMapConfig(!isActiveBaseLayer, noneBasemapLabel));
    }

    return { options };
}
function getNonBaseMapConfig(selected: boolean, label: string) {
    return {
        id: "noneBasemap",
        label,
        selected
    };
}
