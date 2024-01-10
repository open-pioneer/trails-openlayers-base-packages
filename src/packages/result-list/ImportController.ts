// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Point } from "ol/geom";
import { ObjectWithAttributsAndGeometry, ResultData, ResultColumn } from "./api";

export const dummyFeatureData: ObjectWithAttributsAndGeometry[] = [
    {
        attributes: {
            "a": "Test",
            "b": 123,
            "c": 4.567,
            "d": true,
            "e": new Date("2020-05-12T23:50:21.817Z")
        },
        geometry: new Point([404567.3, 5757788.32])
    },
    {
        attributes: {
            "a": "Test123",
            "b": 434,
            "c": 78.567,
            "d": false,
            "e": new Date("2021-05-12T23:50:21.817Z")
        },
        geometry: new Point([406510.87, 5758314.82])
    },
    {
        attributes: {
            "a": "Testabc",
            "b": 666,
            "c": 8.597,
            "d": true,
            "e": new Date("2020-10-12T23:30:21.817Z")
        },
        geometry: new Point([406590.87, 5758311.82])
    }
];

export const dummyMetaData: ResultColumn[] = [
    {
        name: "a",
        displayName: "Spalte A",
        width: 100
    },
    {
        name: "b",
        displayName: "Spalte B",
        width: 50
    },
    {
        name: "c",
        displayName: "Spalte C",
        width: 150
    },
    {
        name: "d",
        displayName: "Spalte D",
        width: 75
    },
    {
        name: "e",
        displayName: "Spalte E",
        width: 50
    }
];

/**
 * Interface for Developer to change data in Result-UI
 */
export class ImportController {
    #onSetData: (data: ResultData | null) => Promise<unknown>;

    constructor(onSetData: (data: ResultData | null) => Promise<unknown>) {
        this.#onSetData = onSetData;
    }

    setDataSource(data: ResultData | null) {
        return this.#onSetData(data);
    }
}
