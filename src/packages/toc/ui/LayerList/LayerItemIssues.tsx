// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { List, Span, Text } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import { useIntl } from "open-pioneer:react-hooks";
import { ElementType, ReactNode, useMemo } from "react";
import { LuCircleAlert, LuInfo, LuTriangleAlert } from "react-icons/lu";
import {
    getWorstSeverity,
    isSevere,
    IssueSeverity,
    LayerIssue,
    PropagatedIssue
} from "../../new-model/LayerIssue";
import { NodeIssues, TocLayerNode } from "../../new-model/TocLayerNode";

export interface LayerItemIssuesResult {
    /** Same content as the indicator, rendered separately for screen readers. */
    label: ReactNode;

    /** The indicator to show next to the layer title. */
    indicator: ReactNode;

    /** Whether the node's checkbox is disabled. */
    disabled: boolean;

    /** Whether to show the node in a muted state. */
    muted: boolean;
}

/**
 * Derives the UI state for the issues of a layer item from the node's issues.
 */
export function useLayerItemIssues(node: TocLayerNode): LayerItemIssuesResult {
    const intl = useIntl();
    const issues = useReactiveSnapshot(() => node.issues, [node]);

    const { worstSeverity, muted, disabled } = useMemo(() => {
        const { own, propagated } = issues;
        return {
            worstSeverity: getWorstSeverity([...own, ...propagated]),

            // Only the node's own visibility counts, not that of hidden children.
            muted: own.some((issue) => issue.kind === "not-visible-in-scale"),

            // Only disable the checkbox for the layer that is the actual source
            // of the problem, so a group with a broken child can still be toggled.
            disabled: own.some(
                (issue) => issue.kind !== "children-not-available" && isSevere(issue)
            )
        };
    }, [issues]);

    const label = useMemo(() => getIndicatorLabel(issues, intl), [issues, intl]);

    return useMemo(
        () => ({
            indicator: worstSeverity && <IssueIndicator severity={worstSeverity} message={label} />,
            label,
            disabled,
            muted
        }),
        [label, worstSeverity, disabled, muted]
    );
}

// Same icons as notifier
const ICONS: Record<IssueSeverity, ElementType> = {
    info: LuInfo,
    warning: LuCircleAlert,
    error: LuTriangleAlert
};

const COLORS: Record<IssueSeverity, undefined | "orange" | "red"> = {
    info: undefined,
    warning: "orange",
    error: "red"
};

function IssueIndicator(props: { severity: IssueSeverity; message: ReactNode }) {
    const { severity, message } = props;
    const Icon = ICONS[severity];
    const color = COLORS[severity];
    return (
        <Tooltip
            content={message}
            positioning={{ placement: "right" }}
            contentProps={{ className: "toc-layer-item-problem-indicator-tooltip" }}
        >
            <Span className="toc-layer-item-problem-indicator">
                {/* aria-hidden: layer item has an aria label that includes the problem as well */}
                <Icon aria-hidden={true} color={color} />
            </Span>
        </Tooltip>
    );
}

/**
 * Builds the message shown in the problem indicator.
 */
function getIndicatorLabel(issues: NodeIssues, intl: PackageIntl): ReactNode {
    const { own, propagated } = issues;
    const labels: ReactNode[] = own.map((issue) => getIssueLabel(issue, intl));
    if (propagated.length) {
        labels.push(
            <>
                <Text>{intl.formatMessage({ id: "childLayerNotAvailableDetails" })}</Text>
                <List.Root ml={2}>
                    {propagated.map((issue, index) => (
                        // oxlint-disable-next-line react/no-array-index-key
                        <List.Item key={index}>
                            <PropagatedIssueLabel issue={issue} />
                        </List.Item>
                    ))}
                </List.Root>
            </>
        );
    }

    if (labels.length === 0) {
        return undefined;
    }
    if (labels.length === 1) {
        return labels[0];
    }
    return (
        <List.Root ml={2}>
            {labels.map((label, index) => (
                // oxlint-disable-next-line react/no-array-index-key
                <List.Item key={index}>{label}</List.Item>
            ))}
        </List.Root>
    );
}

/** Renders `<layer title>: <message>` and keeps the title up to date. */
function PropagatedIssueLabel(props: { issue: PropagatedIssue }) {
    const { issue } = props;
    const intl = useIntl();
    const title = useReactiveSnapshot(() => issue.layer.title, [issue.layer]);
    return `${title}: ${issue.message || getIssueLabel(issue, intl)}`;
}

function getIssueLabel(issue: LayerIssue, intl: PackageIntl): string {
    switch (issue.kind) {
        case "not-visible-in-scale":
            return intl.formatMessage({ id: "layerNotVisible" });
        case "layer-not-available":
            return intl.formatMessage({ id: "layerNotAvailable" });
        case "children-not-available":
            return intl.formatMessage({ id: "childLayerNotAvailable" });
    }
}
