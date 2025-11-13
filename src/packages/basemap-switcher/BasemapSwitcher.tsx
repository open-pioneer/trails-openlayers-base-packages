// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, createListCollection, Portal, Select, Text } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { Layer, MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useMemo } from "react";
import { type IconType } from "react-icons/lib";
import { LuInfo, LuTriangleAlert } from "react-icons/lu";

/*
    Exported for tests. Feels a bit hacky but should be fine for now.
    Originally was using the empty string, but that doesn't work well with happy-dom.
*/
export const NO_BASEMAP_ID = "___NO_BASEMAP___";

/**
 * Properties for single select options.
 */
interface SelectOption {
    /**
     * The id of the basemap for the select option.
     */
    value: string;

    /**
     * The label of the select option.
     */
    label: string;

    /**
     * The layer object for the select option.
     * Undefined is used for "no basemap".
     */
    layer: Layer | undefined;
}

/**
 * These are special properties for the BasemapSwitcher.
 */
export interface BasemapSwitcherProps extends CommonComponentProps, MapModelProps {
    /**
     * Additional css class name(s) that will be added to the BasemapSwitcher component.
     */
    className?: string;

    /**
     * Specifies whether an option to deactivate all basemap layers is available in the BasemapSwitcher.
     * Defaults to `false`.
     */
    allowSelectingEmptyBasemap?: boolean | undefined;

    /**
     * Optional aria-labelledby property.
     * Do not use together with aria-label.
     */
    "aria-labelledby"?: string;

    /**
     * Optional aria-label property.
     * Do not use together with aria-label.
     */
    "aria-label"?: string;
}

/**
 * The `BasemapSwitcher` component can be used in an app to switch between the different basemaps.
 */
export const BasemapSwitcher: FC<BasemapSwitcherProps> = (props) => {
    const map = useMapModelValue(props);
    const intl = useIntl();
    const {
        allowSelectingEmptyBasemap = false,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy
    } = props;
    const { containerProps } = useCommonComponentProps("basemap-switcher", props);
    const emptyBasemapLabel = intl.formatMessage({ id: "emptyBasemapLabel" });

    const activateLayer = (layerId: string[]) => {
        map.layers.activateBaseLayer(layerId[0] === NO_BASEMAP_ID ? undefined : layerId[0]);
    };

    const { optionsListCollection, selectedOption } = useReactiveSnapshot(() => {
        const baseLayers = map.layers.getBaseLayers() ?? [];
        const options: SelectOption[] = baseLayers.map<SelectOption>((layer) => {
            return {
                value: layer.id,
                layer: layer,
                label: layer.title,
                disabled: layer.loadState == "error"
            };
        });

        const activeBaseLayer = map.layers.getActiveBaseLayer();
        if (allowSelectingEmptyBasemap || activeBaseLayer == null) {
            const emptyOption: SelectOption = {
                value: NO_BASEMAP_ID,
                layer: undefined,
                label: emptyBasemapLabel
            };
            options.push(emptyOption);
        }
        const optionsListCollection = createListCollection({ items: options });
        const selectedOption = optionsListCollection.find(activeBaseLayer?.id ?? NO_BASEMAP_ID);
        if (!selectedOption) {
            throw new Error("Internal error: selected option not found in list.");
        }

        return { optionsListCollection, selectedOption };
    }, [allowSelectingEmptyBasemap, emptyBasemapLabel, map]);

    return (
        <Box {...containerProps}>
            <Select.Root
                collection={optionsListCollection}
                value={[selectedOption.value]}
                onValueChange={(option) => option && activateLayer(option.value)}
                className="basemap-switcher-select"
                lazyMount={true}
                unmountOnExit={true}
            >
                <Select.Control>
                    <Select.Trigger
                        aria-label={ariaLabel}
                        aria-labelledby={ariaLabelledBy}
                        className="basemap-switcher-select-trigger"
                    >
                        <Select.ValueText display="flex" alignItems="center">
                            <BasemapItemContent option={selectedOption} />
                        </Select.ValueText>
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                        <Select.Indicator />
                    </Select.IndicatorGroup>
                </Select.Control>

                <Portal>
                    <Select.Positioner>
                        <Select.Content className="basemap-switcher-select-content">
                            {optionsListCollection.items.map((item) => (
                                <BasemapItem item={item} key={item.value} />
                            ))}
                        </Select.Content>
                    </Select.Positioner>
                </Portal>
            </Select.Root>
        </Box>
    );
};

function BasemapItem(props: { item: SelectOption }) {
    const item = props.item;

    return (
        <Select.Item
            item={item}
            key={item.value}
            justifyContent="flex-start"
            // Override pointer-events: none rule for disabled items; we want to show the tooltip on hover
            pointerEvents="auto"
            className="basemap-switcher-option"
        >
            <BasemapItemContent option={item} />
        </Select.Item>
    );
}

function BasemapItemContent(props: { option: SelectOption }) {
    const { option } = props;
    const intl = useIntl();
    const loadState = useReactiveSnapshot(() => option.layer?.loadState, [option.layer]);
    const visibleInScale = useReactiveSnapshot(() => option.layer?.visibleInScale, [option.layer]);

    const { problem, opacity } = useMemo(() => {
        let problem = undefined;
        let opacity = undefined;
        if (option.layer) {
            if (loadState === "error") {
                problem = (
                    <ProblemIndicator
                        Icon={LuTriangleAlert}
                        color="red"
                        message={intl.formatMessage({ id: "layerNotAvailable" })}
                    />
                );
            } else if (!visibleInScale) {
                problem = (
                    <ProblemIndicator
                        Icon={LuInfo}
                        message={intl.formatMessage({ id: "layerNotVisible" })}
                    />
                );
                opacity = 0.5;
            }
        }
        return { problem, opacity };
    }, [option.layer, loadState, visibleInScale, intl]);

    return (
        <>
            <Text as="span" opacity={opacity}>
                {option.label}
            </Text>
            {problem}
        </>
    );
}

function ProblemIndicator(props: { Icon: IconType; message: string; color?: string }) {
    const { Icon, message, color } = props;
    return (
        <Box ml={2}>
            <Tooltip content={message} aria-label={message} positioning={{ placement: "right" }}>
                <span>
                    <Icon
                        className="basemap-layer-item-icon-info"
                        aria-label={message}
                        color={color}
                    />
                </span>
            </Tooltip>
        </Box>
    );
}
