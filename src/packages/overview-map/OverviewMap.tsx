// SPDX-FileCopyrightText: con terra GmbH and contributors
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
    layer: TileLayer<WMTS> | VectorLayer<VectorSource> | ImageLayer<ImageWMS>;

    /**
     * The zoom of the overview map
     */
    zoom?: number;
}

/**
 * The `OverviewMap` component can be used in an app to have a better overview of the current location in the map.
 */
export const OverviewMap: FC<OverviewMapProps> = (props) => {
    const { mapId, layer, zoom } = props;
    const { containerProps } = useCommonComponentProps("overview-map", props);
    const overviewMapControlElem = useRef(null);
    const { map } = useMapModel(mapId);

    useEffect(() => {
        if (overviewMapControlElem.current && map && layer) {
            const olMap = map.olMap;
            const overviewMapControl: OlOverviewMap = new OlOverviewMap({
                className: "overviewmap custom-overviewmap",
                layers: [layer],
                collapseLabel: "\u00BB",
                label: "\u00AB",
                collapsed: false
            });
            olMap.addControl(overviewMapControl);
            return () => {
                olMap.removeControl(overviewMapControl);
            };
        }
    }, [map, layer]);

    return <Box ref={overviewMapControlElem} {...containerProps}></Box>;
};
