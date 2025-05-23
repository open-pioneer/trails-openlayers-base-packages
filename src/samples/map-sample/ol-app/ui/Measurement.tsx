// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { Measurement } from "@open-pioneer/measurement";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { useId } from "react";

export function MeasurementComponent() {
    const measurementTitleId = useId();
    const intl = useIntl();
    return (
        <Box role="dialog" aria-labelledby={measurementTitleId}>
            <TitledSection
                title={
                    <SectionHeading id={measurementTitleId} size="md" mb={2}>
                        {intl.formatMessage({
                            id: "measurementTitle"
                        })}
                    </SectionHeading>
                }
            >
                <Measurement />
            </TitledSection>
        </Box>
    );
}
