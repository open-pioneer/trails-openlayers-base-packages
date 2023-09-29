// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import {
    Box,
    BoxProps,
    Button,
    FormControl,
    FormLabel,
    Switch,
    Text
} from "@open-pioneer/chakra-integration";
import { FC } from "react";
import { useIntl } from "open-pioneer:react-hooks";
import classNames from "classnames";
import { HStack } from "@chakra-ui/react";
export interface MeasurementProps extends BoxProps {
    /**
     * Additional css class name(s) that will be added to the Measurement component.
     */
    className?: string;
}

export const Measurement: FC<MeasurementProps> = (props) => {
    const intl = useIntl();
    const { className, ...rest } = props;

    const label = (id: string) => intl.formatMessage({ id: id });

    return (
        <Box className={classNames("measurement", className)} {...rest}>
            <Box
                className="measurement-header"
                padding={2}
                backgroundColor="var(--chakra-colors-blackAlpha-500)"
            >
                <Text as="b">{label("measurementTitle")}</Text>
            </Box>
            <Box className="measeurement-content" padding={2}>
                <FormControl mb={4} alignItems="center">
                    <HStack mb={2}>
                        <FormLabel htmlFor="measure-distance" mb={1}>
                            {label("measureDistanceLabel")}{" "}
                        </FormLabel>
                        <Switch id="measure-distance" size="md" />
                    </HStack>
                    <HStack>
                        <FormLabel htmlFor="measure-area" mb={1}>
                            {label("measureAreaLabel")}
                        </FormLabel>
                        <Switch id="measure-area" size="md" />
                    </HStack>
                </FormControl>
                <Box>
                    <Button
                        padding={2}
                        className="delete-measurement"
                        aria-label={label("deleteMeasurementLabel")}
                    >
                        {label("deleteMeasurementLabel")}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};
