// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import {
    type SimpleLayerModelConstructor,
    type SimpleLayerModel as SimpleLayerModelType,
    type WMSLayerModelConstructor,
    type WMSLayerModel as WMSLayerModelType
} from "./api";
import { SimpleLayerImpl } from "./model/layers/SimpleLayerImpl";
import { WMSLayerImpl } from "./model/layers/WMSLayerImpl";

/* 
    NOTE: Entities in this file are are exported from the package; they are part of the public interface.
    However, we declare them only using the interfaces defined in the `api` directory: internals (such as __-functions) do not leak (via typescript types).

    Names used here should match the layer interface names used in the `api` directory!
 */

/** {@inheritDoc SimpleLayerModelConstructor} */
export const SimpleLayerModel: SimpleLayerModelConstructor = SimpleLayerImpl;
export type SimpleLayerModel = SimpleLayerModelType;

/** {@inheritDoc WMSLayerModelConstructor} */
export const WMSLayerModel: WMSLayerModelConstructor = WMSLayerImpl;
export type WMSLayerModel = WMSLayerModelType;
