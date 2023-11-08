// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { components, NoticeProps } from "chakra-react-select";
import { useIntl } from "open-pioneer:react-hooks";
import { SearchGroupOption } from "./Search";
import { chakra } from "@open-pioneer/chakra-integration";

export const NoOptionsMessage = (props: NoticeProps<SearchGroupOption>) => {
    const intl = useIntl();
    const noMessageText = intl.formatMessage({ id: "noOptionsText" });

    return (
        <components.NoOptionsMessage {...props}>
            <chakra.span className="search-no-match">{noMessageText}</chakra.span>
        </components.NoOptionsMessage>
    );
};
