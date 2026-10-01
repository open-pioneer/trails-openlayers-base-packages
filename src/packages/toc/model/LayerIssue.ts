// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { shallowEqual } from "@open-pioneer/core";
import { AnyLayer, isSublayer } from "@open-pioneer/map";

/**
 * All known issues that a toc item might have.
 */
export type IssueKind =
    /** The layer is not visible at the current scale / zoom level. */
    | "not-visible-in-scale"
    /** The layer failed to load. */
    | "layer-not-available"
    /** A _child_ of this item has a problem. */
    | "children-not-available";

/**
 * The severity of an issue.
 *
 * This value influences how the issues are rendered in the UI.
 */
export type IssueSeverity = "info" | "warning" | "error";

/**
 * An issue associated with a layer.
 */
export interface LayerIssue {
    severity: IssueSeverity;
    kind: IssueKind;

    /** A custom message for this problem. Can transport error messages. */
    message?: string | undefined;
}

/**
 * An issue that was propagated from a child layer.
 */
export interface PropagatedIssue extends LayerIssue {
    /** The layer that is the actual source of this issue. */
    layer: AnyLayer;
}

/**
 * Returns the issues _immediately_ associated with the given layer.
 *
 * This function does **not** aggregate from children.
 */
export function getLayerIssues(layer: AnyLayer): LayerIssue[] {
    const issues: LayerIssue[] = [];

    const failedLayer = getFailedLayer(layer);
    if (failedLayer) {
        issues.push({
            severity: "error",
            kind: "layer-not-available",
            message: failedLayer.loadError?.message || undefined
        });
        return issues; // No need to evaluate the other conditions
    }

    const map = layer.nullableMap;
    if (!map) {
        return issues;
    }

    if (!isVisibleInScale(layer)) {
        issues.push({
            severity: "info",
            kind: "not-visible-in-scale"
        });
    }

    return issues;
}

/**
 * Returns the layer that failed to load, or `undefined` if the given layer is available.
 * Sublayers also inspect their parent layer's state.
 */
function getFailedLayer(layer: AnyLayer): AnyLayer | undefined {
    if (layer.loadState === "error") {
        return layer;
    }
    if (isSublayer(layer) && layer.parentLayer.loadState === "error") {
        return layer.parentLayer;
    }
    return undefined;
}

function isVisibleInScale(layer: AnyLayer) {
    const target = isSublayer(layer) ? layer.parentLayer : layer;
    return target.visibleInScale;
}

/**
 * Returns true if both arrays contain the same issues.
 */
export function layerIssuesEqual(a: LayerIssue[], b: LayerIssue[]): boolean {
    if (a === b) {
        return true;
    }
    if (a.length !== b.length) {
        return false;
    }
    // Issues are flat objects, shallowEqual does exactly what we want.
    return a.every((issue, index) => shallowEqual(issue, b[index]));
}

/**
 * Numeric values for severities. A higher value is _worse_ than a lower one.
 */
const SEVERITY_VALUES: Record<IssueSeverity, number> = {
    info: 0,
    warning: 1,
    error: 2
} as const;

/**
 * Returns true if the issue is severe enough to be reported to parent nodes.
 * Infos (e.g. "not visible in scale") are not propagated.
 */
export function isSevere(issue: LayerIssue): boolean {
    return SEVERITY_VALUES[issue.severity] > SEVERITY_VALUES["info"];
}

/**
 * Returns the lesser severity.
 */
export function minSeverity(a: IssueSeverity, b: IssueSeverity): IssueSeverity {
    return SEVERITY_VALUES[a] <= SEVERITY_VALUES[b] ? a : b;
}

/**
 * Returns the worst severity among the given issues, or `undefined` if there are no issues.
 */
export function getWorstSeverity(issues: LayerIssue[]): IssueSeverity | undefined {
    let worst: IssueSeverity | undefined;
    for (const issue of issues) {
        if (worst == null || SEVERITY_VALUES[issue.severity] > SEVERITY_VALUES[worst]) {
            worst = issue.severity;
        }
    }
    return worst;
}
