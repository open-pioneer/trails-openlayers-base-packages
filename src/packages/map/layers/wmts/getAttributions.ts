// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/**
 * Returns the attribution derived from the WMTS service metadata (if any).
 *
 * @param capabilities Parsed service capabilities
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function getAttributions(capabilities: Record<string, any>): string | undefined {
    const service = capabilities?.ServiceIdentification;
    if (!service) {
        return undefined;
    }

    const fees = service.Fees;
    if (isSet(fees)) {
        return fees;
    }

    const constraints = service.AccessConstraints;
    if (isSet(constraints)) {
        return constraints;
    }

    return undefined;
}

const NONE = /none/i;

function isSet(value: any): value is string {
    return typeof value === "string" && !!value && !NONE.test(value);
}

/* eslint-enable @typescript-eslint/no-explicit-any */
