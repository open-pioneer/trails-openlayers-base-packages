// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex, VStack, Text } from "@chakra-ui/react";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { ReactNode, type ReactElement } from "react";
import {
    useDeclarativeFormContext,
    usePropertyFormContext
} from "../../context/usePropertyFormContext";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";

export interface PropertyFormProps {
    children?: ReactNode;
}

export function PropertyForm(props: PropertyFormProps): ReactElement {
    const { children } = props;
    const heading = useHeading();
    const context = useDeclarativeFormContext();
    const hasRequiredFields = useReactiveSnapshot(() => context.hasRequiredFields, [context]);
    const { formatRichMessage } = useIntl();

    return (
        <TitledSection>
            <Flex
                className="editor__property-form"
                direction={"column"}
                flex={1}
                overflowY="hidden"
            >
                <SectionHeading mb={2} size="sm">
                    {heading}
                </SectionHeading>
                <VStack
                    gap={4}
                    align="stretch"
                    // for focus ring
                    px="1px"
                    pb="4px"
                    flex={1}
                    overflowY={"auto"}
                >
                    {children}
                </VStack>
                {hasRequiredFields && (
                    <Text
                        fontSize={"sm"}
                        aria-hidden="true"
                        textAlign={"right"}
                        paddingRight={2}
                        mb={2}
                    >
                        <Text as="span" color="fg.error">
                            *
                        </Text>{" "}
                        {formatRichMessage({ id: "propertyEditor.requiredFieldHint" })}
                    </Text>
                )}
            </Flex>
        </TitledSection>
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
