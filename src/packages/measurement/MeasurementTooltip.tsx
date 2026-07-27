// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Span } from "@chakra-ui/react";
import { ReactNode } from "react";

export function MeasurementTooltipContent(props: { content?: ReactNode }) {
    const { content } = props;
    return <Span>{content}</Span>;
}
