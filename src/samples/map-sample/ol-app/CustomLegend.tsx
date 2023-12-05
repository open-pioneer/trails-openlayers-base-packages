// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { LegendItemComponentProps } from "@open-pioneer/legend";

const dotStyle = {
    height: "25px",
    width: "25px",
    borderColor: "#4cb3ff",
    borderWidth: "3px",
    borderRadius: "50%",
    display: "inline-block "
};

export function CustomLegend(props: LegendItemComponentProps) {
    return (
        <div>
            <span>{props.layer.title}:</span>
            <br></br>
            <span style={dotStyle}></span>
        </div>
    );
}
