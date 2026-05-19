// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useIntl } from "open-pioneer:react-hooks";
import { ReactElement } from "react";

export function DemoDescription({ messageId }: { messageId: string }): ReactElement {
    const intl = useIntl();
    return <>{intl.formatRichMessage({ id: messageId })}</>;
}
