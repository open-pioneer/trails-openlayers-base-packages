// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex } from "@open-pioneer/chakra-integration";
import { SectionHeading } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { AppModel } from "../model/AppModel";
import { DemoSelection } from "./DemoSelection";
import { LocaleSwitcher } from "./LocaleSwitcher";

export interface HeaderProps {
    appModel: AppModel;
}

export function Header({ appModel }: HeaderProps) {
    const intl = useIntl();
    return (
        <Flex
            as="header"
            px={2}
            py={3}
            flexWrap={{
                base: "wrap",
                md: "nowrap"
            }}
            alignItems="baseline"
            gap={2}
            boxShadow="1px 0px 3px rgba(0, 0, 0, 0.5)"
            zIndex={1 /* shadow above map */}
        >
            <SectionHeading
                size="md"
                flexShrink={0}
                flexGrow={1}
                textAlign={{
                    base: "center",
                    md: "left"
                }}
                width={{
                    base: "100%",
                    md: "auto"
                }}
                mb={{
                    base: 2,
                    md: 0
                }}
            >
                {intl.formatMessage({ id: "header.title" })}
            </SectionHeading>
            <DemoSelection appModel={appModel} />
            <LocaleSwitcher />
        </Flex>
    );
}
