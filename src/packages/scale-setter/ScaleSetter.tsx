// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ChevronUpIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Portal
} from "@open-pioneer/chakra-integration";
import { useMapModel, useScale } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import { getPointResolution } from "ol/proj";
import { useIntl } from "open-pioneer:react-hooks";
import { FC } from "react";

const DEFAULT_DPI = 25.4 / 0.28;
const INCHES_PER_METRE = 39.37;
const DEFAULT_SCALES = [
    17471320, 8735660, 4367830, 2183915, 1091957, 545978, 272989, 136494, 68247, 34123, 17061, 8530,
    4265, 2132
];

/**
 * These are the properties supported by the {@link ScaleSetter}.
 */
export interface ScaleSetterProps extends CommonComponentProps {
    /**
     * The map id.
     */
    mapId: string;

    /**
     * The set of scales that can be selected by the user.
     */
    scales?: number[];
}

/**
 * Displays the current scale and allows the user to change it.
 */
export const ScaleSetter: FC<ScaleSetterProps> = (props) => {
    const { mapId, scales = DEFAULT_SCALES } = props;
    const { containerProps } = useCommonComponentProps("scale-setter", props);
    const { map } = useMapModel(mapId);
    const intl = useIntl();

    const activeScale = useScale(map?.olMap) ?? 1;

    // TODO: Move to map model (reactivity API refactoring)
    function setScale(scale: number) {
        if (!map) {
            return;
        }

        const view = map.olMap.getView();
        const projection = map.olMap.getView().getProjection();
        const mpu = projection.getMetersPerUnit() ?? 1;
        const resolution = INCHES_PER_METRE * DEFAULT_DPI * mpu;
        const center = map.olMap.getView().getCenter();
        if (!center) {
            return;
        }

        const pointResolution = scale / getPointResolution(projection, resolution, center);
        view.setResolution(pointResolution);
    }

    const scaleSelectOptions = scales.map((sc) => {
        return (
            <MenuItem
                value={sc}
                key={sc}
                onClick={() => setScale(sc)}
                onFocus={(e) => {
                    // Not available in unit tests
                    e.target?.scrollIntoView?.({
                        block: "nearest"
                    });
                }}
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
                    aria-label={intl.formatMessage(
                        {
                            id: "button.ariaLabel"
                        },
                        { scale: activeScale }
                    )}
                >
                    {renderDisplayScale(intl, activeScale)}
                </MenuButton>
                <Portal>
                    <MenuList
                        className="scale-setter-menuoptions"
                        maxHeight="20em"
                        overflowY="auto"
                    >
                        {scaleSelectOptions}
                    </MenuList>
                </Portal>
            </Menu>
        </Box>
    );
};

function renderDisplayScale(intl: PackageIntl, rawScale: number): string {
    return "1 : " + intl.formatNumber(rawScale);
}
