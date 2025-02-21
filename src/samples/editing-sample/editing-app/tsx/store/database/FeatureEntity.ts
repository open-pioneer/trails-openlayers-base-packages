// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Envelope } from "../geometry/Envelope";

export class FeatureEntity {
    constructor({ id, attributes, geometryString, envelope }: FeatureEntityParameter) {
        Object.assign(this, attributes);

        if (typeof id === "number") {
            this.__id__ = id;
        }

        this.__geometry__ = geometryString;
        this.__minX__ = envelope?.minX;
        this.__minY__ = envelope?.minY;
        this.__maxX__ = envelope?.maxX;
        this.__maxY__ = envelope?.maxY;
    }

    get id(): number | undefined {
        return this.__id__;
    }

    get attributes(): Record<string, unknown> {
        return { ...this, __geometry__: undefined };
    }

    get geometryString(): string | undefined {
        return this.__geometry__;
    }

    [attribute: string]: unknown;

    private readonly __id__: number | undefined;
    private readonly __geometry__: string | undefined;

    static readonly SCHEMA_DEFINITION = "++__id__, __minX__, __minY__, __maxX__, __maxY__";
}

export function getFeatureEntityEnvelope(object: Record<string, unknown>): Envelope | undefined {
    const minX = object.__minX__ as number | undefined;
    const minY = object.__minY__ as number | undefined;
    const maxX = object.__maxX__ as number | undefined;
    const maxY = object.__maxY__ as number | undefined;

    if (minX != null && minY != null && maxX != null && maxY != null) {
        return { minX, minY, maxX, maxY };
    } else {
        return undefined;
    }
}

interface FeatureEntityParameter {
    readonly id?: number | string;
    readonly attributes: Record<string, unknown>;
    readonly geometryString?: string;
    readonly envelope?: Envelope;
}
