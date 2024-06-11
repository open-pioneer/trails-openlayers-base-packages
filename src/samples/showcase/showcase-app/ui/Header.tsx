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
        <Flex as="header" p={1}>
            <SectionHeading size="md" flexShrink={0}>
                {intl.formatMessage({ id: "header.title" })}
            </SectionHeading>
            <DemoSelection appModel={appModel} />
            <LocaleSwitcher />
        </Flex>
    );
}
