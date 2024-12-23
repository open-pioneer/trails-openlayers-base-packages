// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { IDBFeatureStore } from "../store/IDBFeatureStore";

export function getStore(databaseName: string | undefined): IDBFeatureStore | undefined {
    if (databaseName != null) {
        return stores[databaseName];
    } else {
        return undefined;
    }
}

export function createStore(databaseName: string): IDBFeatureStore {
    return (stores[databaseName] ??= new IDBFeatureStore(databaseName, UTM32N));
}

const stores: Record<string, IDBFeatureStore> = {};

const UTM32N = { wkid: 25832 };
