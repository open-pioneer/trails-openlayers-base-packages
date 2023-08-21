// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import proj4, { ProjectionDefinition as Proj4ProjectionDefinition } from "proj4";
import { register } from "ol/proj/proj4";

export type ProjectionDefinition = string | Proj4ProjectionDefinition;

export function registerProjections(projections: Record<string, ProjectionDefinition>): void {
    for (const [name, definition] of Object.entries(projections)) {
        proj4.defs(name, definition);
    }
    register(proj4);
}

export function getProjection(name: string): Proj4ProjectionDefinition {
    return proj4.defs(name);
}
