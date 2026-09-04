// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Layer, MapModel } from "@open-pioneer/map";
// oxlint-disable-next-line no-unused-vars
import { type FeatureEditorProps } from "../editor/editor";

/**
 * The context made available to implementations of the {@link FeatureEditorProps.getSelectionAvailability | getSelectionAvailability} property.
 *
 * @group Model
 */
export interface SelectionAvailabilityContext {
    /** The map used by the feature editor. */
    mapModel: MapModel;

    /** The layers the feature editor would use for the selection interaction. */
    layers: Layer[];
}

/**
 * The availability status for the selection button (available / unavailable).
 *
 * @group Model
 */
export type SelectionAvailability = SelectionAvailable | SelectionUnavailable;

/**
 * Selection is available.
 *
 * @group Model
 */
export interface SelectionAvailable {
    status: "available";
}

/**
 * Selection is unavailable.
 *
 * @group Model
 */
export interface SelectionUnavailable {
    status: "unavailable";

    /**
     * The reason for being unavailable.
     * This message will be presented to the user.
     */
    reason?: string;
}
