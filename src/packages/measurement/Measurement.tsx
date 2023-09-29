// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import {
    Box,
    BoxProps,
    Button,
    FormLabel,
    Stack,
    Switch,
    Text
} from "@open-pioneer/chakra-integration";
import { FC } from "react";
import { useIntl } from "open-pioneer:react-hooks";
import classNames from "classnames";
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
                <Stack direction="column">
                    <Box display="flex" alignItems="center" className="measure-distance">
                        <FormLabel htmlFor="measure-distance" mb={1}>
                            {label("measureDistanceLabel")}{" "}
                        </FormLabel>
                        <Switch id="measure-distance" size="md" />
                    </Box>
                    <Box display="flex" alignItems="center" className="measure-area" mb={3}>
                        <FormLabel htmlFor="measure-area" mb={1}>
                            {label("measureAreaLabel")}
                        </FormLabel>
                        <Switch id="measure-area" size="md" />
                    </Box>
                    <Box>
                        <Button
                            padding={2}
                            className="delete-measurement"
                            aria-label={label("deleteMeasurementLabel")}
                        >
                            {label("deleteMeasurementLabel")}
                        </Button>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
};
