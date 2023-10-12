// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import {
    WMSLayerConfig,
    type WMSLayerModel as WMSLayerModelType,
    type SimpleLayerModel as SimpleLayerModelType,
    SimpleLayerConfig
} from "./api/index";
import { SimpleLayerImpl } from "./model/layers/SimpleLayerImpl";
import { WMSLayerImpl } from "./model/layers/WMSLayerImpl";

type ClassConstructor<T, Options extends unknown[]> = {
    prototype: T;
    new (...options: Options): T;
};

/* 
    NOTE: Entities in this file are are exported from the package; they are part of the public interface.
    However, we declare them only using the interfaces defined in the `api` directory: internals (such as __-functions) do not leak (via typescript types).

    Names used here should match the layer interface names used in the `api` directory!
 */

/**
 * {@inheritDoc SimpleLayerModel}
 */
export const SimpleLayerModel: ClassConstructor<SimpleLayerModelType, [config: SimpleLayerConfig]> =
    SimpleLayerImpl;
export type SimpleLayerModel = SimpleLayerModelType;

/**
 * {@inheritDoc WMSLayerModelType}
 */
export const WMSLayerModel: ClassConstructor<WMSLayerModelType, [config: WMSLayerConfig]> =
    WMSLayerImpl;
export type WMSLayerModel = WMSLayerModelType;
