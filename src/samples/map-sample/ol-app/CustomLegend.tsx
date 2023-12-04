// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { LegendItemComponentProps } from "@open-pioneer/legend";

export function CustomLegend(props: LegendItemComponentProps) {
    return <span>{props.layer.title}</span>;
}
