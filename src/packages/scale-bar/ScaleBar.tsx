// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC, useEffect, useRef } from "react";
import { ScaleLine } from "ol/control";
import { Box } from "@open-pioneer/chakra-integration";

/**
 * These are the properties supported by the {@link ScaleBar}.
 */
export interface ScaleBarProps extends CommonComponentProps {
    /**
     * The map id.
     */
    mapId: string;
    /**
     * The map id.
     */
    bar?: boolean;
}

export const ScaleBar: FC<ScaleBarProps> = (props) => {
    const { mapId, bar } = props;
    const { containerProps } = useCommonComponentProps("scale-bar", props);
    const { map } = useMapModel(mapId);
    const scaleBarElem = useRef(null);

    useEffect(() => {
        if (scaleBarElem.current && map) {
            const olMap = map.olMap;
            const scaleLine = new ScaleLine({
                units: "metric",
                target: scaleBarElem.current,
                bar: bar
            });
            olMap.addControl(scaleLine);
            return () => {
                olMap.removeControl(scaleLine);
            };
        }
    }, [bar, map]);

    return <Box {...containerProps} ref={scaleBarElem}></Box>;
};
