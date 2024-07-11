// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMapModel, useScale } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC } from "react";
import { Box, Select } from "@open-pioneer/chakra-integration";
import { useIntl } from "open-pioneer:react-hooks";
const DEFAULT_DPI = 25.4 / 0.28;
const INCHES_PER_METRE = 39.37;
/**
 * These are the properties supported by the {@link ScaleSetter}.
 */
export interface ScaleSetterProps extends CommonComponentProps {
    /**
     * The map id.
     */
    mapId: string;

    mapZoomScales?: number[];
}

export const ScaleSetter: FC<ScaleSetterProps> = (props) => {
    const { mapId, mapZoomScales } = props;
    const { containerProps } = useCommonComponentProps("scale-setter", props);
    const { map } = useMapModel(mapId);
    const intl = useIntl();

    const activeScale = useScale(map?.olMap);
    const displayScale = activeScale ? intl.formatNumber(activeScale) : undefined;

    const advScale = [
        17471320, 8735660, 4367830, 2183915, 1091957, 545978, 272989, 136494, 68247, 34123, 17061,
        8530, 4265, 2132
    ];
    const scaleOptions = mapZoomScales || advScale;

    function setNewZoom(sc: string) {
        if (sc == "") return;
        const tempView = map?.olMap.getView();
        tempView?.setResolution(parseInt(sc) / (INCHES_PER_METRE * DEFAULT_DPI));
        if (tempView != undefined) map?.olMap.setView(tempView);
    }
    const scaleSelectOptions = scaleOptions?.map((sc) => {
        return (
            <option key={sc} value={sc}>
                1 : {intl.formatNumber(sc)}
            </option>
        );
    });

    return (
        <Box {...containerProps}>
            <Select
                value={"1 : " + displayScale}
                placeholder={"1 : " + displayScale}
                onChange={(e) => setNewZoom(e.target.value)}
            >
                {scaleSelectOptions}
            </Select>
        </Box>
    );
};
