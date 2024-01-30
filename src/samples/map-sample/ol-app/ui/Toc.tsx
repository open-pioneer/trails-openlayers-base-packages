// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Text } from "@open-pioneer/chakra-integration";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { Toc } from "@open-pioneer/toc";
import { useIntl } from "open-pioneer:react-hooks";
import { useId } from "react";
import { MAP_ID } from "../MapConfigProviderImpl"; // TODO

export function TocComponent(props: { maxHeight: string }) {
    const tocTitleId = useId();
    const intl = useIntl();

    return (
        <Box role="dialog" aria-labelledby={tocTitleId}>
            <TitledSection
                title={
                    <SectionHeading id={tocTitleId} size="md" mb={2}>
                        <Text>
                            {intl.formatMessage({
                                id: "tocTitle"
                            })}
                        </Text>
                    </SectionHeading>
                }
            >
                <Box overflowY="auto" maxHeight={props.maxHeight}>
                    <Toc
                        mapId={MAP_ID}
                        showTools={true}
                        basemapSwitcherProps={{
                            allowSelectingEmptyBasemap: true
                        }}
                    />
                </Box>
            </TitledSection>
        </Box>
    );
}
