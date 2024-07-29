// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMapModel, useScale } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC, useEffect, useState } from "react";
import {
    Box,
    InputGroup,
    InputLeftAddon,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper
} from "@open-pioneer/chakra-integration";
import { useIntl } from "open-pioneer:react-hooks";
import { getPointResolution } from "ol/proj";
const DEFAULT_DPI = 25.4 / 0.28;
const INCHES_PER_METRE = 39.37;
/**
 * These are the properties supported by the {@link ScaleInput}.
 */
export interface ScaleInputProps extends CommonComponentProps {
    /**
     * The map id.
     */
    mapId: string;
}

export const ScaleInput: FC<ScaleInputProps> = (props) => {
    const { mapId } = props;
    const { containerProps } = useCommonComponentProps("scale-input", props);
    const { map } = useMapModel(mapId);
    const intl = useIntl();
    const activeScale = useScale(map?.olMap);
    const displayScale = activeScale ? intl.formatNumber(activeScale) : undefined;
    const [scaleValue, setScaleValue] = useState<number>(0);

    useEffect(() => {
        if (activeScale !== undefined) setScaleValue(activeScale);
    }, [activeScale]);

    function setNewZoom(sc: string | undefined) {
        if (sc == undefined) return;
        if (map == undefined) return;
        const tempView = map.olMap.getView();
        const projection = map.olMap.getView().getProjection();
        let mpu = projection.getMetersPerUnit();
        if (mpu == undefined) mpu = 1;
        const resolution = parseInt(sc) / (INCHES_PER_METRE * DEFAULT_DPI * mpu);
        const center = map.olMap.getView().getCenter();
        if (center == undefined) return;
        const pointResolution = getPointResolution(projection, resolution, center);
        tempView.setResolution(pointResolution);
    }

    return (
        <Box {...containerProps}>
            <InputGroup>
                <InputLeftAddon>1 : </InputLeftAddon>
                <NumberInput
                    defaultValue={displayScale}
                    value={intl.formatNumber(scaleValue)}
                    min={1}
                    max={140000000}
                    onChange={(valueString) => {
                        setScaleValue(parseInt(valueString.replaceAll(".", ""), 10));
                    }}
                    onKeyDown={(e) => {
                        if (e.key == "Enter") {
                            console.log(scaleValue);
                            setNewZoom(scaleValue.toString().replaceAll(".", ""));
                        }
                    }}
                >
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </InputGroup>
        </Box>
    );
};
