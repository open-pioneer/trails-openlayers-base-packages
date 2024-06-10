// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageIntl } from "@open-pioneer/runtime";
import { ReactNode } from "react";
import { Geolocation } from "@open-pioneer/geolocation";
import { MAP_ID } from "../MapConfigProviderImpl";
import { Printing } from "@open-pioneer/printing";

export interface Demo {
    /** Unique id */
    id: string;

    /** Human readable (and translated) title */
    title: string;

    /** Human readable description */
    description: string;

    /** Main widget to display in the app. */
    mainWidget?: ReactNode;

    /**
     * Tools that are shown next to the zoom buttons on the map.
     */
    additionalTools?: ReactNode;
}

export function createDemos(intl: PackageIntl): Demo[] {
    return [
        {
            id: "geolocation",
            title: intl.formatMessage({ id: "demos.geolocation.title" }),
            description: intl.formatMessage({ id: "demos.geolocation.description" }),
            additionalTools: <Geolocation mapId={MAP_ID} />
        },
        {
            id: "printing",
            title: intl.formatMessage({ id: "demos.printing.title" }),
            description: intl.formatMessage({ id: "demos.printing.description" }),
            mainWidget: <Printing mapId={MAP_ID} />
        }
    ];
}
