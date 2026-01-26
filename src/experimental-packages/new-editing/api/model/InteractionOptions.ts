// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { HighlightOptions } from "@open-pioneer/map";
import type { Options as OlDrawOptions } from "ol/interaction/Draw";
import type { Options as OlSelectOptions } from "ol/interaction/Select";
import type { Options as OlModifyOptions } from "ol/interaction/Modify";
import type { Options as OlSnapOptions } from "ol/interaction/Snap";

/**
 * Configuration options for map interactions during feature editing.
 *
 * Provides fine-grained control over the behavior of drawing, selection, modification, snapping,
 * and highlighting interactions.
 */
export interface InteractionOptions {
    /** Options for drawing new geometries. */
    readonly drawingOptions?: DrawingOptions;

    /** Options for selecting existing features from layers. */
    readonly selectionOptions?: SelectionOptions;

    /** Options for modifying feature geometries. */
    readonly modificationOptions?: ModificationOptions;

    /** Options for snapping to nearby features during drawing or modification. */
    readonly snappingOptions?: SnappingOptions;

    /** Options for highlighting features during modification. */
    readonly highlightingOptions?: HighlightOptions;
}

/**
 * Configuration options for the drawing interaction.
 *
 * These options are passed to the OpenLayers `Draw` interaction, excluding `source` and `type`,
 * which are managed internally. Use this to customize drawing behavior such as geometry function,
 * style, and maximum points.
 *
 * @see https://openlayers.org/en/latest/apidoc/module-ol_interaction_Draw.html
 */
export type DrawingOptions = Omit<OlDrawOptions, "source" | "type">;

/**
 * Configuration options for the feature selection interaction.
 *
 * These options are passed to the OpenLayers `Select` interaction, excluding `layers`, which is
 * managed internally. Use this to customize selection behavior such as hit tolerance, style, and
 * filtering.
 *
 * @see https://openlayers.org/en/latest/apidoc/module-ol_interaction_Select.html
 */
export type SelectionOptions = Omit<OlSelectOptions, "layers">;

/**
 * Configuration options for the geometry modification interaction.
 *
 * These options are passed to the OpenLayers `Modify` interaction, excluding `features` and
 * `source`, which are managed internally. Use this to customize modification behavior such as
 * vertex style, pixel tolerance, and deletion conditions.
 *
 * @see https://openlayers.org/en/latest/apidoc/module-ol_interaction_Modify.html
 */
export type ModificationOptions = Omit<OlModifyOptions, "features" | "source">;

/**
 * Configuration options for the snapping interaction.
 *
 * These options are passed to the OpenLayers `Snap` interaction, excluding `features` and `source`,
 * which are managed internally. Use this to customize snapping behavior such as pixel tolerance
 * and edge snapping.
 *
 * @see https://openlayers.org/en/latest/apidoc/module-ol_interaction_Snap.html
 */
export type SnappingOptions = Omit<OlSnapOptions, "features" | "source">;
