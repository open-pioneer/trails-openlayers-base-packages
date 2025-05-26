// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { List, ListRootProps, Text } from "@chakra-ui/react";
import { AnyLayer, MapModel } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { memo, useMemo } from "react";
import { LayerItem } from "./LayerItem";
import { useLayers } from "./hooks";

interface TopLevelLayerListProps {
    map: MapModel;

    /** The label of the list group (<ul>) */
    "aria-label"?: string;
}

/**
 * Lists the operational layers in the map.
 */
export const TopLevelLayerList = memo(function TopLevelLayerList(props: TopLevelLayerListProps) {
    const { map, "aria-label": ariaLabel } = props;
    const intl = useIntl();
    const layers = useLayers(map);

    if (!layers.length) {
        return (
            <Text className="toc-missing-layers" aria-label={ariaLabel}>
                {intl.formatMessage({ id: "missingLayers" })}
            </Text>
        );
    }

    return <LayerList layers={layers} aria-label={ariaLabel} />;
});

/**
 * Renders the given layers as a list (<ul>).
 */
export const LayerList = memo(function LayerList(props: { layers: AnyLayer[] } & ListRootProps) {
    const { layers, ...listProps } = props;
    const items = useMemo(
        () => layers.map((layer) => <LayerItem key={layer.id} layer={layer} />),
        [layers]
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
