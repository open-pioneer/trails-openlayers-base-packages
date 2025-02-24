// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { Legend } from "@open-pioneer/legend";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { useId } from "react";

export function LegendComponent() {
    const legendTitleId = useId();
    const intl = useIntl();

    return (
        <Box role="dialog" aria-labelledby={legendTitleId}>
            <TitledSection
                title={
                    <SectionHeading id={legendTitleId} size="md" mb={2}>
                        {intl.formatMessage({
                            id: "legendTitle"
                        })}
                    </SectionHeading>
                }
            >
                <Box overflowY="auto" maxHeight={300}>
                    <Legend showBaseLayers={true} />
                </Box>
            </TitledSection>
        </Box>
    );
}
