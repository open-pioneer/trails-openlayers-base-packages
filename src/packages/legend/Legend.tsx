// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { IoIosWarning } from "react-icons/io";
import { Box, Image, List, Text, Icon } from "@chakra-ui/react";
import { Layer, AnyLayer, MapModel, useMapModel, MapModelProps, isLayer } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { ComponentType, FC, ReactNode, useEffect, useMemo, useState } from "react";

/**
 * Properties of a legend item React component.
 */
export interface LegendItemComponentProps {
    /**
     * Related layer of the legend.
     */
    layer: AnyLayer;
}

/**
 * Attributes of the legend attribute that can be specified on a layer.
 *
 * To show a legend for the layer, provide an imageUrl to an image to show
 * or provide a React component that will be rendered as a legend.
 *
 * LegendItemAttributes should be registered with a layer as the `"legend"` attribute.
 */
export interface LegendItemAttributes {
    /**
     * (Optional) URL to an image that will be shown as a legend for the layer.
     */
    imageUrl?: string;

    /**
     * (Optional) React component that will be shown as customized legend for the layer.
     */
    Component?: ComponentType<LegendItemComponentProps>;
}

/**
 * These are special properties for the Legend.
 */
export interface LegendProps extends CommonComponentProps, MapModelProps {
    /**
     * Specifies whether legend for active base layer is shown in the legend UI.
     * Defaults to `false`.
     */
    showBaseLayers?: boolean;
}

/**
 * The `Legend` component can be used to display the legend of layers that are visible in the map.
 */
export const Legend: FC<LegendProps> = (props) => {
    const { showBaseLayers = false } = props;
    const { containerProps } = useCommonComponentProps("legend", props);
    const { map } = useMapModel(props);

    return (
        <Box {...containerProps}>
            {map ? <LegendList map={map} showBaseLayers={showBaseLayers} /> : null}
        </Box>
    );
};

function LegendList(props: { map: MapModel; showBaseLayers: boolean }): ReactNode {
    const { map, showBaseLayers } = props;

    const layers = useLayers(map);
    const legendListItems: ReactNode[] = layers.map((layer) => {
        return (
            <LegendItem key={layer.id} layer={layer} showBaseLayers={showBaseLayers}></LegendItem>
        );
    });

    return (
        <List.Root
            // Note: not using UnorderedList because it adds default margins
            as="ul"
            className="legend-layer-list"
            listStyleType="none"
            gap={2}
        >
            {legendListItems}
        </List.Root>
    );
}

function LegendItem(props: { layer: AnyLayer; showBaseLayers: boolean }): ReactNode {
    const { layer, showBaseLayers } = props;
    const isVisible = useReactiveSnapshot(() => layer.visible, [layer]);
    const childLayers = useChildLayers(layer);

    if (!isVisible) {
        return undefined;
    }

    if (!showBaseLayers && isLayer(layer) && isBaseLayer(layer)) {
        return undefined;
    }

    // legend items for all child layers (sublayers or layers in a group)
    const childItems: ReactNode[] = [];
    if (childLayers?.length) {
        childLayers.forEach((childLayer) => {
            childItems.push(
                <LegendItem
                    key={childLayer.id}
                    layer={childLayer}
                    showBaseLayers={showBaseLayers}
                />
            );
        });
    }

    return (
        <>
            <LegendContent layer={layer} showBaseLayers={showBaseLayers} />
            {childItems}
        </>
    );
}

function LegendContent(props: { layer: AnyLayer; showBaseLayers: boolean }) {
    const intl = useIntl();

    const { layer, showBaseLayers } = props;
    const baseLayer = isBaseLayer(layer);
    const legendAttributes = useLegendAttributes(layer);
    const legendUrl = useReactiveSnapshot(() => layer.legend, [layer]);

    let renderedComponent: ReactNode | undefined;
    if (legendAttributes?.Component) {
        renderedComponent = <legendAttributes.Component layer={layer} />;
    } else if (legendAttributes?.imageUrl) {
        renderedComponent = <LegendImage layer={layer} imageUrl={legendAttributes.imageUrl} />;
    } else {
        if (legendUrl) {
            renderedComponent = <LegendImage layer={layer} imageUrl={legendUrl} />;
        }
    }

    return renderedComponent ? (
        <Box as="li" className={classNames("legend-item", `layer-${slug(layer.id)}`)}>
            {showBaseLayers && baseLayer ? (
                /* Render additional text, if layer is a configured basemap */
                <Text as="b">{intl.formatMessage({ id: "basemapLabel" })}</Text>
            ) : null}
            {renderedComponent}
        </Box>
    ) : undefined;
}

function LegendImage(props: { imageUrl: string; layer: AnyLayer }) {
    const intl = useIntl();

    const { layer, imageUrl } = props;

    const [isError, setIsError] = useState(false);
    useEffect(() => {
        setIsError(false);
    }, [imageUrl]);

    const content = useMemo(() => {
        if (isError) {
            return (
                <Box>
                    <Text>
                        <Icon me={2}>
                            <IoIosWarning />
                        </Icon>
                        {intl.formatMessage({ id: "fallbackLabel" })}
                    </Text>
                </Box>
            );
        }

        return (
            <Image
                maxW="none"
                maxH="none"
                src={imageUrl}
                alt={intl.formatMessage({ id: "altLabel" }, { layerName: layer.title })}
                className={"legend-item__image"}
                onError={() => setIsError(true)}
            />
        );
    }, [intl, layer.title, imageUrl, isError]);

    return (
        <Box>
            <Text>{layer.title}</Text>
            {content}
        </Box>
    );
}

/** Returns the top level operational layers in render order (topmost layer first). */
function useLayers(map: MapModel): Layer[] {
    return useReactiveSnapshot(() => {
        const layers = map.layers.getLayers({ sortByDisplayOrder: true }) ?? [];
        layers.reverse(); // render topmost layer first
        return layers;
    }, [map]);
}

/**
 * Returns the child layers (sublayers or layers belonging to a GroupLayer) of the given layer
 * (or undefined, if the child layer cannot have any).
 * Layers are returned in render order (topmost layer first).
 */
function useChildLayers(layer: AnyLayer): AnyLayer[] | undefined {
    return useReactiveSnapshot(() => {
        const childLayers = layer.children?.getItems();
        if (!childLayers) {
            return undefined;
        }

        childLayers.reverse(); // render topmost layer first
        return childLayers;
    }, [layer]);
}

function useLegendAttributes(layer: AnyLayer): LegendItemAttributes | undefined {
    return useReactiveSnapshot(
        () => layer.attributes.legend as LegendItemAttributes | undefined,
        [layer]
    );
}

function isBaseLayer(layer: AnyLayer) {
    return !("parentLayer" in layer) && layer.isBaseLayer;
}

function slug(id: string) {
    return id
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
