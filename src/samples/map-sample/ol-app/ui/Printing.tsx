// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { Printing } from "@open-pioneer/printing";
import { useIntl } from "open-pioneer:react-hooks";
import { useId } from "react";
import { MAP_ID } from "../MapConfigProviderImpl";

export function PrintingComponent() {
    const printingTitleId = useId();
    const intl = useIntl();
    return (
        <Box
            backgroundColor="white"
            borderWidth="1px"
            borderRadius="lg"
            padding={2}
            boxShadow="lg"
            role="dialog"
            width={350}
        >
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
                    <Printing mapId={MAP_ID} />
                </TitledSection>
            </Box>
        </Box>
    );
}
