// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, VStack } from "@chakra-ui/react";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { ReactNode, type ReactElement } from "react";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";

export interface PropertyFormProps {
    children?: ReactNode;
}

export function PropertyForm(props: PropertyFormProps): ReactElement {
    const { children } = props;
    const heading = useHeading();

    return (
        <Flex className="editor__property-form" direction="column" height="full">
            <TitledSection>
                <SectionHeading mb={2} size="sm">
                    {heading}
                </SectionHeading>
                <Box flex={1} overflowY="auto">
                    <VStack
                        gap={4}
                        align="stretch"
                        // for focus ring
                        px="1px"
                        pb="4px"
                    >
                        {children}
                    </VStack>
                </Box>
            </TitledSection>
        </Flex>
    );
}

function useHeading() {
    const intl = useIntl();
    const { mode, formTemplate: template } = usePropertyFormContext();
    const defaultHeading = intl.formatMessage({
        id:
            mode === "update"
                ? "propertyEditor.defaultEditHeading"
                : "propertyEditor.defaultCreateHeading"
    });
    return template?.name ? `${defaultHeading}: ${template?.name} ` : defaultHeading;
}
