// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { Measurement } from "@open-pioneer/measurement";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { useId } from "react";
import { MAP_ID } from "../map/MapConfigProviderImpl";

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
                <Measurement mapId={MAP_ID} />
            </TitledSection>
        </Box>
    );
}
