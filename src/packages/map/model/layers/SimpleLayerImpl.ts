// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SimpleLayer } from "../../api";
import { AbstractLayer } from "../AbstractLayer";

/**
 * A simple layer that accepts a custom OpenLayer's layer instance.
 *
 * Some API features (such as sublayers) will not be available.
 */
export class SimpleLayerImpl extends AbstractLayer implements SimpleLayer {
    get type() {
        return "simple" as const;
    }

    get legend(): undefined {
        return undefined;
    }

    get layers(): undefined {
        return undefined;
    }

    get sublayers(): undefined {
        return undefined;
    }
}
