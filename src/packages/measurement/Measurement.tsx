// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import {
    Box,
    Button,
    FormControl,
    FormLabel,
    HStack,
    Select
} from "@open-pioneer/chakra-integration";
import { FC, useEffect, useState } from "react";
import { useIntl } from "open-pioneer:react-hooks";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";

/**
 * This is for special properties of the Measurement.
 */
export interface MeasurementProps extends CommonComponentProps {}

/**
 * The `Measurement` component can be used in an app to switch between distance and area measurements and to delete all current measurements.
 */
export const Measurement: FC<MeasurementProps> = (props) => {
    const intl = useIntl();

    const { containerProps } = useCommonComponentProps("basemap-switcher", props);
    const [selectedMeasurement, setMeasurement] = useState("distance");

    useEffect(() => {
        console.log("mount");
        //start selected measurement
        return () => {
            console.log("unmount");
            clearMeasurements();
            //stop the measurement interaction
        };
    }, []);

    const label = (id: string) => intl.formatMessage({ id: id });

    function clearMeasurements() {
        console.log("Clear drawn measurements");
    }

    function changeMeasurement(measurement: string) {
        setMeasurement(measurement);
        //activate selected measurement
    }

    return (
        <Box {...containerProps}>
            <Box className="measurement-content" padding={2}>
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
                    className="delete-measurements"
                    onClick={clearMeasurements}
                    width="100%"
                >
                    {label("deleteMeasurementLabel")}
                </Button>
            </Box>
        </Box>
    );
};
