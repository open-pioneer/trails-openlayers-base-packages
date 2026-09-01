// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { List, ListRootProps, Text } from "@chakra-ui/react";
import { AnyLayer, MapModel } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";
import { memo, useMemo } from "react";
import { TocLayerNode } from "../../new-model/TocLayerNode";
import { TocViewModel } from "../../new-model/TocViewModel";
import { displayItemForLayer } from "../../utils/displayLayer";
import { LayerItem } from "./LayerItem";

interface TopLevelLayerListProps {
    map: MapModel;
    viewModel: TocViewModel;

    /** The label of the list group (<ul>) */
    "aria-label"?: string;
}

/**
 * Lists the operational layers in the map.
 */
export const TopLevelLayerList = memo(function TopLevelLayerList(props: TopLevelLayerListProps) {
    const { map, viewModel, "aria-label": ariaLabel } = props;
    const intl = useIntl();
    const nodes = useReactiveSnapshot(() => viewModel.children, [viewModel]);
    const empty = useReactiveSnapshot(() => isEmpty(nodes.map((node) => node.layer)), [nodes]); // TODO: hacky -- make this a getter on the node?
    if (empty) {
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
        () => nodes.map((node) => <LayerItem key={node.id} node={node} />),
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
 * Checks if there is any layer that should be displayed in the Toc
 */
function isEmpty(layers: AnyLayer[]): boolean {
    const isEmpty = !layers.length || layers.every((l) => !displayItemForLayer(l));

    return isEmpty;
}
