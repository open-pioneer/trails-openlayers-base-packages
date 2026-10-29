// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { List, ListRootProps, Text } from "@chakra-ui/react";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";
import { memo, ReactNode, useMemo } from "react";
import { TocLayerNode } from "../../model/TocLayerNode";
import { TocViewModel } from "../../model/TocViewModel";
import { LayerItem } from "./LayerItem";

interface TopLevelLayerListProps {
    viewModel: TocViewModel;

    /** The label of the list group (<ul>) */
    "aria-label"?: string;
}

/**
 * Lists the operational layers in the map.
 */
export const TopLevelLayerList = memo(function TopLevelLayerList(props: TopLevelLayerListProps) {
    const { viewModel, "aria-label": ariaLabel } = props;
    const intl = useIntl();
    const nodes = useReactiveSnapshot(() => viewModel.shownChildren, [viewModel]);
    if (nodes.length === 0) {
        return (
            <Text className="toc-missing-layers" aria-label={ariaLabel}>
                {intl.formatMessage({ id: "missingLayers" })}
            </Text>
        );
    }

    return <LayerList nodes={nodes} aria-label={ariaLabel} />;
});

/**
 * Renders the given layers as a list (<ul>).
 */
export const LayerList = memo(function LayerList(props: { nodes: TocLayerNode[] } & ListRootProps) {
    const { nodes, ...listProps } = props;
    const items = useMemo(
        () =>
            nodes.map((node) => (
                <LayerItem key={node.id} node={node} renderNestedList={renderNestedList} />
            )),
        [nodes]
    );

    return (
        <List.Root
            // Note: not using UnorderedList because it adds default margins
            as="ul"
            className="toc-layer-list"
            listStyleType="none"
            {...listProps}
        >
            {items}
        </List.Root>
    );
});

/**
 * Renders a nested layer list for child layers of a LayerItem.
 *
 * Used as a callback in LayerItem to avoid a circular import between LayerList and LayerItem.
 */
function renderNestedList(childNodes: TocLayerNode[], listProps: ListRootProps): ReactNode {
    return <LayerList nodes={childNodes} {...listProps} />;
}
