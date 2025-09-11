// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Icon, Image, List, Text } from "@chakra-ui/react";
import {
    AnyLayer,
    Layer,
    MapModel,
    MapModelProps,
    isLayer,
    useMapModelValue
} from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { ComponentType, FC, ReactNode, useEffect, useMemo, useState } from "react";
import { LuTriangleAlert } from "react-icons/lu";

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

    /**
     * (Optional) Additional property to control the display of the layer in the legend.
     */
    listMode?: ListMode;
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
 * ListMode determines if a layer item is displayed in the Legend for the layer.
 * The option `"hide-children"` provides a shortcut to hide all child layers (e.g. sublayers of group) of the layer in the Legend.
 * It has the same effect as manually setting the `listMode` to `"hide"` on all child layers.
 *
 * ListMode has precedence over the layer's `internal` attribute but specifically configures the layer's display in the legend.
 *
 * By default, the list mode becomes `"hide-children"` if a layer has an associated legend.
 */
export type ListMode = "show" | "hide" | "hide-children";

/**
 * The `Legend` component can be used to display the legend of layers that are visible in the map.
 */
export const Legend: FC<LegendProps> = (props) => {
    const { showBaseLayers = false } = props;
    const { containerProps } = useCommonComponentProps("legend", props);
    const map = useMapModelValue(props);

    return (
        <Box {...containerProps}>
            <LegendList map={map} showBaseLayers={showBaseLayers} />
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
    const { isVisible, isInternal } = useReactiveSnapshot(() => {
        return {
            isVisible: layer.visible,
            isInternal: layer.internal
        };
    }, [layer]);
    const childLayers = useChildLayers(layer);
    const listModeProp = useListMode(layer);
    const legendContent = useLegendContent(layer);
    const listMode = getListMode(listModeProp, isInternal, !!legendContent);

    if (!isVisible || listMode === "hide" || (!showBaseLayers && isBaseLayer(layer))) {
        return;
    }

    // legend items for all child layers (sublayers or layers in a group)
    let childItems: ReactNode[] = [];
    if (listMode === "show") {
        childItems = childLayers.map((child) => (
            <LegendItem key={child.id} layer={child} showBaseLayers={showBaseLayers} />
        ));
    }
    // listMode: hide/hide-children -> childItems stays empty

    return (
        <>
            <LegendContent layer={layer} content={legendContent} />
            {childItems}
        </>
    );
}

function LegendContent(props: { layer: AnyLayer; content: ReactNode }) {
    const intl = useIntl();

    const { layer, content } = props;
    const baseLayer = isBaseLayer(layer);
    return content ? (
        <Box as="li" className={classNames("legend-item", `layer-${slug(layer.id)}`)}>
            {baseLayer ? (
                /* Render additional text, if layer is a configured basemap */
                <Text as="b">{intl.formatMessage({ id: "basemapLabel" })}</Text>
            ) : null}
            {content}
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
                            <LuTriangleAlert />
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

/**
 * Resolves the content that would be rendered for the given layer.
 */
function useLegendContent(layer: AnyLayer): ReactNode | undefined {
    const legendAttributes = useLegendAttributes(layer);
    const legendUrl = useReactiveSnapshot(() => layer.legend, [layer]);
    return useMemo(() => {
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
        return renderedComponent;
    }, [legendUrl, legendAttributes, layer]);
}

/** Returns the top level operational layers in render order (topmost layer first). */
function useLayers(map: MapModel): Layer[] {
    return useReactiveSnapshot(() => {
        const layers =
            map.layers.getLayers({
                sortByDisplayOrder: true,
                includeInternalLayers: true //internal status is handled by LegendItems
            }) ?? [];
        layers.reverse(); // render topmost layer first
        return layers;
    }, [map]);
}

/**
 * Returns the child layers (sublayers or layers belonging to a GroupLayer) of the given layer.
 * Layers are returned in render order (topmost layer first).
 */
function useChildLayers(layer: AnyLayer): AnyLayer[] {
    return (
        useReactiveSnapshot(() => {
            const childLayers = layer.children?.getItems();
            if (!childLayers) {
                return undefined;
            }

            childLayers.reverse(); // render topmost layer first
            return childLayers;
        }, [layer]) ?? []
    );
}

function useLegendAttributes(layer: AnyLayer): LegendItemAttributes | undefined {
    return useReactiveSnapshot(
        () => layer.attributes.legend as LegendItemAttributes | undefined,
        [layer]
    );
}

function getListMode(
    listModeProp: ListMode | undefined,
    isInternal: boolean,
    hasLegendContent: boolean
): ListMode {
    if (listModeProp) {
        return listModeProp; // Explicit value wins
    }
    if (isInternal) {
        return "hide";
    }
    if (hasLegendContent) {
        return "hide-children";
    }
    return "show";
}

function isBaseLayer(layer: AnyLayer) {
    return isLayer(layer) && layer.isBaseLayer;
}

function slug(id: string) {
    return id
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function useListMode(layer: AnyLayer): ListMode | undefined {
    return useReactiveSnapshot(
        () => (layer.attributes.legend as LegendItemAttributes | undefined)?.listMode,
        [layer]
    );
}
