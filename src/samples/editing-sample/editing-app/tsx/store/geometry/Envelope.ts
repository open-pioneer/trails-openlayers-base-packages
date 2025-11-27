// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
export interface Envelope {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
}

export function envelopesOverlap(envelopeA: Envelope, envelopeB: Envelope): boolean {
    return (
        envelopeA.minX <= envelopeB.maxX &&
        envelopeA.maxX >= envelopeB.minX &&
        envelopeA.minY <= envelopeB.maxY &&
        envelopeA.maxY >= envelopeB.minY
    );
}
