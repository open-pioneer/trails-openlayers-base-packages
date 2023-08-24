// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { register } from "ol/proj/proj4";
import proj4, { ProjectionDefinition as Proj4ProjectionDefinition } from "proj4";

export type ProjectionDefinition = string | Proj4ProjectionDefinition;

/**
 * Adds new registrations to the global [proj4js](https://github.com/proj4js/proj4js) definition set.
 *
 * See the proj4js documentation for more details.
 *
 * Example:
 *
 * ```ts
 * import { registerProjections } from "@open-pioneer/ol-map";
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
export function getProjectionDefinition(name: string): Proj4ProjectionDefinition {
    return proj4.defs(name);
}
