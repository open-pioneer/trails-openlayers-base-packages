// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Geometry } from "ol/geom";
import { Style } from "ol/style";

/**
 * Base Interface for all objects with geometry and / or attributs informationen. The object may be displayed on the map
 */
export interface BaseFeature {
    /**
     * Identifier for the feature object. Values used here should be unique.
     *
     * If your source cannot provide a useful id on its own, another strategy to generate unique ids is to
     * generate a [UUID](https://www.npmjs.com/package/uuid#uuidv4options-buffer-offset) instead.
     */
    id: number | string;

    /**
     * Geometry of the selection result.
     * One should also specify the {@link projection}.
     */
    geometry?: Geometry;

    /**
     * The projection of the {@link geometry}.
     */
    projection?: string;

    /**
     * Arbitrary additional properties.
     */
    properties?: Readonly<Record<string, unknown>>;

    /**
     * Additional style information for display on the map
     */
    style?: Style;
}
