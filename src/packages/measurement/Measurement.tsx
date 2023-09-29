// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { Box, BoxProps, Text } from "@open-pioneer/chakra-integration";
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

    const measurementTitle = intl.formatMessage({ id: "measurementTitle" });

    return (
        <Box className={classNames("measurement", className)} {...rest}>
            <Box
                className="measurement-header"
                padding={2}
                backgroundColor="var(--chakra-colors-blackAlpha-500)"
            >
                <Text as="b">{measurementTitle}</Text>
            </Box>
            <Box className="measeurement-content" padding={2}>
                Content
            </Box>
        </Box>
    );
};
