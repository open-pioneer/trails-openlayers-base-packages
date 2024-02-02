// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Point } from "ol/geom";
import { ResultColumn } from "./api";
import { BaseFeature } from "@open-pioneer/map/api/BaseFeature";

const DATE_FORMAT = Intl.DateTimeFormat("de-DE", {
    dateStyle: "full",
    timeStyle: "full",
    timeZone: "UTC"
});

// Todo formatierung der datumswerte. Nochmal anschauen bei Bearbeitung von issue #241.
// Stable date format for tests.
function formatDate(date: Date) {
    return DATE_FORMAT.format(date);
}

export const dummyFeatureData: BaseFeature[] = [
    {
        id: "1",
        properties: {
            "a": "Test",
            "b": 123,
            "c": 4.567,
            "d": true,
            "e": formatDate(new Date("2020-05-12T23:50:21.817Z"))
        },
        geometry: new Point([404567.3, 5757788.32])
    },
    {
        id: "2",
        properties: {
            "a": "Test123",
            "b": 434,
            "c": 78.567,
            "d": false,
            "e": formatDate(new Date("2021-05-12T23:50:21.817Z"))
        },
        geometry: new Point([406510.87, 5758314.82])
    },
    {
        id: "3",
        properties: {
            "a": "Testabc",
            "b": 666,
            "c": 8.597,
            "d": true,
            "e": formatDate(new Date("2020-10-12T23:30:21.817Z"))
        },
        geometry: new Point([406590.87, 5758311.82])
    },
    {
        id: "4",
        properties: {
            "a": undefined,
            "b": undefined,
            "c": undefined,
            "d": undefined,
            "e": undefined
        },
        geometry: new Point([406590.87, 5758311.82])
    }
];

export const dummyMetaData: ResultColumn[] = [
    {
        propertyName: "a",
        displayName: "Spalte A",
        width: 100
    },
    {
        propertyName: "b",
        displayName: "Spalte B",
        width: 50
    },
    {
        propertyName: "c",
        displayName: "Spalte C",
        width: 150
    },
    {
        propertyName: "d",
        displayName: "Spalte D",
        width: 75
    },
    {
        propertyName: "e",
        displayName: "Spalte E",
        width: 50
    }
];

export const dummyFeatureDataAlt: BaseFeature[] = [
    {
        id: "1",
        properties: {
            "f": "Test 42",
            "g": undefined
        },
        geometry: undefined
    }
];

export const dummyMetaDataAlt: ResultColumn[] = [
    {
        propertyName: "properties.f",
        displayName: "Spalte F",
        width: 200
    },
    {
        propertyName: "properties.g",
        displayName: "Spalte G",
        width: 300
    }
];
