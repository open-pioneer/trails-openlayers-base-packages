// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/**
 * Package-internal constructor tag to signal that the layer constructor is being called from the layer factory.
 *
 * @internal
 */
export const INTERNAL_CONSTRUCTOR_TAG = Symbol("INTERNAL_CONSTRUCTOR_TAG");
export type InternalConstructorTag = typeof INTERNAL_CONSTRUCTOR_TAG;

export function assertInternalConstructor(tag: InternalConstructorTag) {
    if (tag !== INTERNAL_CONSTRUCTOR_TAG) {
        throw new Error("This constructor is internal.");
    }
}
