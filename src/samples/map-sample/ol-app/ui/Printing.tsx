// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { Printing } from "@open-pioneer/printing";
import { useIntl } from "open-pioneer:react-hooks";
import { useId } from "react";

export function PrintingComponent() {
    const printingTitleId = useId();
    const intl = useIntl();
    return (
        <Box role="dialog" aria-labelledby={printingTitleId}>
            <TitledSection
                title={
                    <SectionHeading id={printingTitleId} size="md" mb={2}>
                        {intl.formatMessage({
                            id: "printingTitle"
                        })}
                    </SectionHeading>
                }
            >
                <Printing />
            </TitledSection>
        </Box>
    );
}
