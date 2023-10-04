// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import {
    Box,
    BoxProps,
    Button,
    FormControl,
    FormLabel,
    Text,
    HStack,
    Select
} from "@open-pioneer/chakra-integration";
import { FC, useEffect, useState } from "react";
import { useIntl } from "open-pioneer:react-hooks";
import classNames from "classnames";

export interface MeasurementProps extends BoxProps {
    /**
     * Specifies whether measurement widget is active or not.
     */
    active: boolean;

    /**
     * Additional css class name(s) that will be added to the Measurement component.
     */
    className?: string;
}

export const Measurement: FC<MeasurementProps> = (props) => {
    const intl = useIntl();

    const { active, className, ...rest } = props;
    let activateWidget = active || false;
    const [selectedMeasurement, setMeasurement] = useState("distance");

    useEffect(() => {
        activateWidget = active;
        if (!active) {
            console.log("deactivate measurement", active);
        }
    }, [active]);

    const label = (id: string) => intl.formatMessage({ id: id });

    function deleteMeasurements() {}
    function changeMeasurement(measurement: string) {
        setMeasurement(measurement);
    }

    return (
        <Box className={classNames("measurement", className)} {...rest}>
            {activateWidget ? (
                <Box>
                    <Box
                        className="measurement-header"
                        padding={2}
                        backgroundColor="var(--chakra-colors-blackAlpha-500)"
                    >
                        <Text as="b">{label("measurementTitle")}</Text>
                    </Box>
                    <Box className="measurement-content" padding={2}>
                        <FormControl mb={4} alignItems="center">
                            <HStack mb={2}>
                                <FormLabel htmlFor="measurement" mb={1}>
                                    {label("measurementLabel")}{" "}
                                </FormLabel>
                                <Select
                                    value={selectedMeasurement}
                                    onChange={(e) => changeMeasurement(e.target.value)}
                                    className="measurement-select"
                                    id="measurement"
                                >
                                    <option value={"distance"}>{label("distance")}</option>
                                    <option value={"area"}>{label("area")}</option>
                                </Select>
                            </HStack>
                        </FormControl>
                        <Button
                            padding={2}
                            className="delete-measurements"
                            aria-label={label("deleteMeasurementLabel")}
                            onClick={deleteMeasurements}
                            width="100%"
                        >
                            {label("deleteMeasurementLabel")}
                        </Button>
                    </Box>
                </Box>
            ) : (
                ""
            )}
            ;
        </Box>
    );
};
