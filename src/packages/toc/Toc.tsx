// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BasemapSwitcher, BasemapSwitcherProps } from "@open-pioneer/basemap-switcher";
import { Box, Flex, Spacer, Text } from "@open-pioneer/chakra-integration";
import { MapModelProps, useMapModel } from "@open-pioneer/map";
import {
    CommonComponentProps,
    SectionHeading,
    TitledSection,
    useCommonComponentProps
} from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useId, useMemo, useCallback, useState } from "react";
import { ListItemsExpandedModel, LayerList, LayerListRef } from "./LayerList";
import { TocWidgetOptions, TocWidgetOptionsProvider } from "./Context";
import { Tools } from "./Tools";

/**
 * Props supported by the {@link Toc} component.
 */
export interface TocProps extends CommonComponentProps, MapModelProps {
    /**
     * Defines whether the tool component is shown in the toc.
     * Defaults to `false`.
     */
    showTools?: boolean;

    /**
     * Properties for the embedded tool component.
     */
    toolsConfig?: ToolsConfig;

    /**
     * Defines whether the basemap switcher is shown in the toc.
     * Defaults to `true`.
     */
    showBasemapSwitcher?: boolean;

    /**
     * Properties for the embedded basemap switcher.
     * Property "mapId" is not applied.
     */
    basemapSwitcherProps?: Omit<BasemapSwitcherProps, "mapId">;

    /**
     * If `true` groups in the toc can be collapsed and expanded.
     * Defaults to `false`.
     */
    collapsibleGroups?: boolean;

    /*
     * Show the parent layers when a child layer is made visible.
     * Defaults to `true`.
     */
    autoShowParents?: boolean;
}

/**
 * Props supported by the {@link Tools} component.
 */
export interface ToolsConfig {
    /**
     * Optional property to show the `hide all layers` entry.
     * Defaults to `true`.
     */
    showHideAllLayers?: boolean;

    /**
     * Optional property to show the `collapse all groups` entry.
     * Defaults to `true`. Only applicable if `tocProps.collapsibleGroups` is `true`
     */
    showCollapseAllGroups?: boolean;
}

const PADDING = 2;

/**
 * Displays the layers of the configured map.
 */
export const Toc: FC<TocProps> = (props: TocProps) => {
    const intl = useIntl();
    const {
        showTools = false,
        toolsConfig,
        showBasemapSwitcher = true,
        basemapSwitcherProps,
        collapsibleGroups = false,
        autoShowParents = true
    } = props;
    const { containerProps } = useCommonComponentProps("toc", props);
    const basemapsHeadingId = useId();
    const options = useMemo(
        (): TocWidgetOptions => ({ autoShowParents, collapsibleGroups }),
        [autoShowParents, collapsibleGroups]
    );
    const state = useMapModel(props);
    const [listItemsExpandedModel, setListItemsExpandedModel] = useState<
        ListItemsExpandedModel | undefined
    >();
    const handleLayerListRef = useCallback((node: LayerListRef) => {
        if (node) {
            setListItemsExpandedModel(node.listItemsExpandedModel); //set model if ref is actually set
        }
    }, []);
    //only applicable if groups are actually collapsible
    const showCollapseAllGroups = toolsConfig
        ? toolsConfig.showCollapseAllGroups && options.collapsibleGroups
        : options.collapsibleGroups;

    let content: JSX.Element | null;
    switch (state.kind) {
        case "loading":
            content = null;
            break;
        case "rejected":
            content = <Text className="toc-error">{intl.formatMessage({ id: "error" })}</Text>;
            break;
        case "resolved": {
            const map = state.map;
            const basemapSwitcher = showBasemapSwitcher && (
                <Box className="toc-basemap-switcher">
                    <TitledSection
                        title={
                            <SectionHeading id={basemapsHeadingId} size={"sm"} mb={PADDING}>
                                {intl.formatMessage({ id: "basemapsLabel" })}
                            </SectionHeading>
                        }
                    >
                        <BasemapSwitcher
                            map={map}
                            aria-labelledby={basemapsHeadingId}
                            {...basemapSwitcherProps}
                        />
                    </TitledSection>
                </Box>
            );

            const layerList = (
                <Box className="toc-operational-layers">
                    <TitledSection
                        title={
                            <SectionHeading size={"sm"} mb={2}>
                                <Flex>
                                    <Text my={3}>
                                        {intl.formatMessage({
                                            id: "operationalLayerLabel"
                                        })}
                                    </Text>
                                    <Spacer />
                                    {showTools && (
                                        <Tools
                                            map={map}
                                            listItemsExpandedModel={listItemsExpandedModel}
                                            showHideAllLayers={toolsConfig?.showHideAllLayers}
                                            showCollapseAllGroups={showCollapseAllGroups}
                                        />
                                    )}
                                </Flex>
                            </SectionHeading>
                        }
                    >
                        <LayerList
                            map={map}
                            aria-label={intl.formatMessage({ id: "operationalLayerLabel" })}
                            ref={handleLayerListRef}
                        ></LayerList>
                    </TitledSection>
                </Box>
            );

            content = (
                <>
                    {basemapSwitcher}
                    {layerList}
                </>
            );
            break;
        }
    }

    return (
        <Flex {...containerProps} direction="column" gap={PADDING}>
            <TocWidgetOptionsProvider value={options}>{content}</TocWidgetOptionsProvider>
        </Flex>
    );
};
