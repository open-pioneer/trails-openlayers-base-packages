// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Geometry } from "ol/geom";
import { Style } from "ol/style";

/**
 * Base interface for all feature objects with geometry and / or attribute information.
 */
export interface BaseFeature {
    /**
     * Identifier for the feature object. Must be unique within all features of one source/layer.
     *
     * If your source cannot provide a useful id on its own, another strategy to generate unique ids is to
     * generate a [UUID](https://www.npmjs.com/package/uuid#uuidv4options-buffer-offset) instead.
     */
    id: number | string;

    /**
     * Geometry of the feature.
     * Also specify the {@link projection} if geometry is set.
     */
    geometry?: Geometry;

    /**
     * The projection of the {@link geometry}.
     */
    projection?: string;

    /**
     * Properties of the feature.
     */
    properties?: Readonly<Record<string, unknown>>;

    /**
     * Additional style information for displaying the feature on the map.
     */
    style?: Style;
}
