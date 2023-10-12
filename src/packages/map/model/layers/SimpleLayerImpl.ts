// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { AbstractLayerModel } from "../AbstractLayerModel";

/**
 * A simple layer that accepts a custom OpenLayer's layer instance.
 *
 * Some API features (such as sublayers) will not be available.
 */
export class SimpleLayerImpl extends AbstractLayerModel {
    get sublayers(): undefined {
        return undefined;
    }
}
