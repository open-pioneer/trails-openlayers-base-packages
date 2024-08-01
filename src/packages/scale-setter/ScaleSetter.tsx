// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMapModel, useScale } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC } from "react";
import {
    Box,
    Button,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Portal
} from "@open-pioneer/chakra-integration";
import { useIntl } from "open-pioneer:react-hooks";
import { PackageIntl } from "@open-pioneer/runtime";
import { getPointResolution } from "ol/proj";
import { ChevronUpIcon } from "@chakra-ui/icons";
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

    scales?: number[];
}

export const ScaleSetter: FC<ScaleSetterProps> = (props) => {
    const { mapId, scales } = props;
    const { containerProps } = useCommonComponentProps("scale-setter", props);
    const { map } = useMapModel(mapId);
    const intl = useIntl();

    const activeScale = useScale(map?.olMap);

    const advScale = [
        17471320, 8735660, 4367830, 2183915, 1091957, 545978, 272989, 136494, 68247, 34123, 17061,
        8530, 4265, 2132
    ];
    const scaleOptions = scales || advScale;

    function setNewZoom(sc: string) {
        if (sc == undefined) return;
        if (map == undefined) return;
        const tempView = map.olMap.getView();
        const projection = map.olMap.getView().getProjection();
        let mpu = projection.getMetersPerUnit();
        if (mpu == undefined) mpu = 1;
        const resolution = INCHES_PER_METRE * DEFAULT_DPI * mpu;
        const center = map.olMap.getView().getCenter();
        if (center == undefined) return;
        const pointResolution = parseInt(sc) / getPointResolution(projection, resolution, center);
        tempView.setResolution(pointResolution);
    }
    const scaleSelectOptions = scaleOptions?.map((sc) => {
        return (
            <MenuItem
                value={sc}
                key={sc}
                onClick={() => setNewZoom(sc.toString())}
                className="scale-setter-option"
            >
                {renderDisplayScale(intl, sc)}
            </MenuItem>
        );
    });

    return (
        <Box {...containerProps}>
            <Menu isLazy>
                <MenuButton
                    as={Button}
                    rightIcon={<ChevronUpIcon />}
                    className="scale-setter-menubutton"
                >
                    {renderDisplayScale(intl, activeScale ? activeScale : 1)}
                </MenuButton>
                <Portal>
                    <MenuList className="scale-setter-menuoptions">{scaleSelectOptions}</MenuList>
                </Portal>
            </Menu>
        </Box>
    );
};

function renderDisplayScale(intl: PackageIntl, rawScale: number): string {
    return "1 : " + intl.formatNumber(rawScale);
}
