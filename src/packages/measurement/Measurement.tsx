// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import {
    Box,
    Button,
    FormControl,
    FormLabel,
    HStack,
    Select,
    Text
} from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useEffect, useState } from "react";
import { MeasurementController, MeasurementType } from "./MeasurementController";
import { Style } from "ol/style";
import { StyleLike } from "ol/style/Style";
import { FlatStyleLike } from "ol/style/flat";

/**
 * This is for special properties of the Measurement.
 */
export interface MeasurementProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * style for the active drawing feature's geometry
     */
    activeFeatureStyle: Style;

    /**
     * style for the finished feature's geometry
     */
    finishedFeatureStyle: StyleLike | FlatStyleLike;
}

/**
 * The `Measurement` component can be used in an app to switch between distance and area measurements and to delete all current measurements.
 */
export const Measurement: FC<MeasurementProps> = (props) => {
    const intl = useIntl();

    const { mapId, activeFeatureStyle, finishedFeatureStyle } = props;
    const { containerProps } = useCommonComponentProps("measurement", props);
    const [selectedMeasurement, setMeasurement] = useState<MeasurementType>("distance");
    const label = (id: string) => intl.formatMessage({ id: id });

    const state = useMapModel(mapId);
    const map = state.map;
    const [controller, setController] = useState<MeasurementController | undefined>(undefined);
    useEffect(() => {
        if (!map) {
            return;
        }

        const controller = new MeasurementController(
            map.olMap,
            intl,
            activeFeatureStyle,
            finishedFeatureStyle
        );
        setController(controller);
        return () => {
            controller.destroy();
            setController(undefined);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, intl]);

    useEffect(() => {
        if (!controller) {
            return;
        }

        controller.startMeasurement(selectedMeasurement);
        return () => {
            controller.stopMeasurement();
        };
    }, [controller, selectedMeasurement]);

    function changeMeasurement(measurementType: string) {
        if (measurementType === "distance" || measurementType === "area") {
            setMeasurement(measurementType);
        } else {
            throw new Error(`Unexpected measurement type: '${measurementType}'.`);
        }
    }

    function removeMeasurements() {
        controller?.clearMeasurements();
    }

    return (
        <Box {...containerProps}>
            <Box className="measurement-content" padding={2}>
                <Text mb={2}>{intl.formatMessage({ id: "measurementInfoText" })}</Text>
                <FormControl mb={4} alignItems="center">
                    <HStack mb={2}>
                        <FormLabel mb={1}>{label("measurementLabel")}</FormLabel>
                        <Select
                            value={selectedMeasurement}
                            onChange={(e) => changeMeasurement(e.target.value)}
                            className="measurement-select"
                        >
                            <option value={"distance"}>{label("distance")}</option>
                            <option value={"area"}>{label("area")}</option>
                        </Select>
                    </HStack>
                </FormControl>
                <Button
                    padding={2}
                    className="measurment-delete-button"
                    onClick={removeMeasurements}
                    width="100%"
                >
                    {label("deleteMeasurementLabel")}
                </Button>
            </Box>
        </Box>
    );
};
