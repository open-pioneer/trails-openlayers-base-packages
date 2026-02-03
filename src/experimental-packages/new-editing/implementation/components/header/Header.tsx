// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { TitledSection } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { Box, Flex } from "@chakra-ui/react";
import { useMemo, type ReactElement, type ReactNode } from "react";
import type { FormTemplate } from "../../../api/model/FeatureTemplate";

export function Header({ title, template, children }: HeaderProps): ReactElement {
    const defaultTitle = useDefaultTitle();

    return (
        <Flex direction="column" height="full">
            <TitledSection
                title={title ?? template?.name ?? defaultTitle}
                sectionHeadingProps={{ size: "md", mb: 4 }}
            >
                <Box flex={1} overflowY="auto">
                    {children}
                </Box>
            </TitledSection>
        </Flex>
    );
}

function useDefaultTitle(): string {
    const { formatMessage } = useIntl();
    return useMemo(() => formatMessage({ id: "header.defaultTitle" }), [formatMessage]);
}

interface HeaderProps {
    readonly title: string | undefined;
    readonly template?: FormTemplate;
    readonly children: ReactNode;
}
