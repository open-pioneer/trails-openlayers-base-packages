// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Geometry } from "ol/geom";

export interface DataSource {
    readonly label: string;
    search(inputValue: string, options?: { signal?: AbortSignal }): Promise<Suggestion[]>;
}

export interface Suggestion {
    id: number | string;
    text: string;
    geometry?: Geometry;
    properties?: Readonly<Record<string, unknown>>;
}
