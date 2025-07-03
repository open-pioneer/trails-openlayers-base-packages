// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { register } from "ol/proj/proj4";
import proj4 from "proj4";

// Select return type of (name: string) => ProjectionDefinition overload since ProjectionDefinition is not exported
type Proj4ProjectionDefinition = typeof proj4.defs extends infer R
    ? R extends (name: string) => unknown
        ? ReturnType<R>
        : never
    : never;

export type ProjectionDefinition = string | Proj4ProjectionDefinition;

/**
 * Adds new registrations to the global [proj4js](https://github.com/proj4js/proj4js) definition set.
 *
 * See the proj4js documentation for more details.
 *
 * Example:
 *
 * ```ts
 * import { registerProjections } from "@open-pioneer/map";
 *
 * registerProjections({
 *   "EPSG:25832": "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
 *   // ... more projections
 * });
 * ```
 *
 * @param projections
 *      An object containing (key, definition) pairs. The key must be projection name (such as `"EPSG:4326"`).
 *      The value can be a string defining the projection or an existing proj4 definition object.
 */
export function registerProjections(projections: Record<string, ProjectionDefinition>): void {
    for (const [name, definition] of Object.entries(projections)) {
        proj4.defs(name, definition);
    }
    register(proj4);
}

/**
 * Searches the global [proj4js](https://github.com/proj4js/proj4js) definition set for a definition with the given name.
 */
export function getProjection(name: string): Proj4ProjectionDefinition {
    return proj4.defs(name);
}
