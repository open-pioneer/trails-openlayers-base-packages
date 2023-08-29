// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Select } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { FC, useState } from "react";
import { useBasemapLayers } from "./useBasemapLayers";

interface NoneBasemapConfig {
    id: string;
    label: string;
}
interface SelectOptions {
    id: string;
    label: string;
}

export interface BasemapSwitcherProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * The ID for the current selected active BaseLayer
     */
    baseLayerId: string;

    /**
     * The config object if none basemap option is settet
     */
    noneBasemap: NoneBasemapConfig | undefined;
}

export const BasemapSwitcher: FC<BasemapSwitcherProps> = function BasemapSwitcher(
    props: BasemapSwitcherProps
) {
    const { mapId, baseLayerId, noneBasemap } = props;
    const { map } = useMapModel(mapId);
    const layerCollection = map?.layers;
    const [value, setValue] = useState(baseLayerId);
    const { baseLayers } = useBasemapLayers(value, layerCollection);

    const options: SelectOptions[] | undefined = baseLayers?.map((item) => ({
        id: item.id,
        label: item.title
    }));

    if (noneBasemap) {
        options?.push(noneBasemap);
    }

    return (
        <>
            {options?.length ? (
                <Select value={value} onChange={(e) => setValue(e.target.value)}>
                    {options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                            {opt.label}
                        </option>
                    ))}
                </Select>
            ) : (
                ""
            )}
        </>
    );
};
