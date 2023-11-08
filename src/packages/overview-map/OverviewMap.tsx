// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import WMTS from "ol/source/WMTS";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import ImageWMS from "ol/source/ImageWMS";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { FC, useEffect, useRef } from "react";
import { useMapModel } from "@open-pioneer/map";
import { Box } from "@open-pioneer/chakra-integration";
import { OverviewMap as OlOverviewMap } from "ol/control";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import OSM from "ol/source/OSM";
import { MapboxVectorLayer } from "ol-mapbox-style";

/**
 * These are special properties for the OverviewMap.
 */
export interface OverviewMapProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * The layer shown in the overview map
     */
    layer:
        | TileLayer<WMTS>
        | TileLayer<OSM>
        | VectorLayer<VectorSource>
        | MapboxVectorLayer
        | ImageLayer<ImageWMS>;
}

/**
 * The `OverviewMap` component can be used in an app to have a better overview of the current location in the map.
 */
export const OverviewMap: FC<OverviewMapProps> = (props) => {
    const { mapId, layer } = props;
    const { containerProps } = useCommonComponentProps("overview-map", props);
    const overviewMapControlElem = useRef(null);
    const { map } = useMapModel(mapId);

    useEffect(() => {
        if (overviewMapControlElem.current && map && layer) {
            const olMap = map.olMap;
            const overviewMapControl: OlOverviewMap = new OlOverviewMap({
                className: "ol-overviewmap",
                layers: [layer],
                collapsible: false,
                collapsed: false,
                target: overviewMapControlElem.current
            });
            olMap.addControl(overviewMapControl);
            return () => {
                olMap.removeControl(overviewMapControl);
            };
        }
    }, [map, layer]);

    return <Box ref={overviewMapControlElem} {...containerProps}></Box>;
};
