// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Geometry } from "ol/geom";
import { Style } from "ol/style";

/**
 * Base interface for all feature objects with geometry and / or attribute information.
 *
 * @typeParam PropertiesType The type of the properties of the feature.
 *            Use this parameter if you know the shape of features ahead of time.
 *            Note that this parameter should be some kind of object (not an array or primitive type).
 */
export interface BaseFeature<PropertiesType = Readonly<Record<string, unknown>>> {
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
    properties?: PropertiesType;

    /**
     * Additional style information for displaying the feature on the map.
     */
    style?: Style;
}
