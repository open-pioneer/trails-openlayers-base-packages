// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactiveMap } from "@conterra/reactivity-core";
import { BasemapSwitcher, BasemapSwitcherProps } from "@open-pioneer/basemap-switcher";
import { Box, Flex, Spacer, Text } from "@open-pioneer/chakra-integration";
import { MapModel, MapModelProps, useMapModel } from "@open-pioneer/map";
import {
    CommonComponentProps,
    SectionHeading,
    TitledSection,
    useCommonComponentProps
} from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useId, useMemo, useState } from "react";
import { TocWidgetOptions, TocWidgetOptionsProvider } from "../Context";
import { TocItem, TocModel, TocModelProvider } from "../model/TocModel";
import { TopLevelLayerList } from "./LayerList/LayerList";
import { Tools } from "./Tools/Tools";

/**
 * Props supported by the {@link Toc} component.
 */
export interface TocProps extends CommonComponentProps, MapModelProps {
    /**
     * Defines whether the tool component is shown in the toc.
     *
     * Defaults to `false`.
     */
    showTools?: boolean;

    /**
     * Properties for the embedded tool component.
     */
    toolsConfig?: ToolsConfig;

    /**
     * Defines whether the basemap switcher is shown in the toc.
     *
     * Defaults to `true`.
     */
    showBasemapSwitcher?: boolean;

    /**
     * Properties for the embedded basemap switcher.
     *
     * Property `mapId` is not applied (the basemap switcher uses the same map as the).
     */
    basemapSwitcherProps?: Omit<BasemapSwitcherProps, "mapId">;

    /**
     * If `true`, groups in the toc can be collapsed and expanded.
     *
     * Defaults to `false`.
     */
    collapsibleGroups?: boolean;

    /**
     * If `true` groups in the toc are collapsed initially.
     *
     * Defaults to `false`. Only applicable if {@link collapsibleGroups} is `true`.
     */
    isCollapsed?: boolean;

    /**
     * Show the parent layers when a child layer is made visible.
     *
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
     *
     * Defaults to `true`.
     */
    showHideAllLayers?: boolean;

    /**
     * Optional property to show the `collapse all groups` entry.
     *
     * Defaults to `true`. Only applicable if {@link TocProps.collapsibleGroups} is `true`.
     */
    showCollapseAllGroups?: boolean;
}

const PADDING = 2;

/**
 * Displays the layers of the configured map.
 */
export const Toc: FC<TocProps> = (props: TocProps) => {
    const intl = useIntl();
    const { containerProps } = useCommonComponentProps("toc", props);
    const state = useMapModel(props);

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
            content = <TocContent {...props} map={map} />;
            break;
        }
    }

    return (
        <Flex {...containerProps} direction="column" gap={PADDING}>
            {content}
        </Flex>
    );
};

/** This component is rendered once we have a reference to the loaded map model. */
function TocContent(props: TocProps & { map: MapModel }) {
    const {
        map,
        showTools = false,
        toolsConfig,
        showBasemapSwitcher = true,
        basemapSwitcherProps,
        collapsibleGroups = false,
        autoShowParents = true
    } = props;
    const intl = useIntl();
    const [isCollapsed, setIsCollapsed] = useState(props.isCollapsed || false);
    const model = useTocModel();

    const basemapsHeadingId = useId();
    const options = useMemo(
        (): TocWidgetOptions => ({ autoShowParents, collapsibleGroups, isCollapsed }),
        [autoShowParents, collapsibleGroups, isCollapsed]
    );

    //only applicable if groups are actually collapsible
    const showCollapseAllGroups = toolsConfig
        ? toolsConfig.showCollapseAllGroups && options.collapsibleGroups
        : options.collapsibleGroups;

    //overwrite `isCollapsed`, if groups are not actually collapsible
    if (!options.collapsibleGroups && isCollapsed) {
        setIsCollapsed(false);
    }

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
        <TocModelProvider value={model}>
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
                                        showHideAllLayers={toolsConfig?.showHideAllLayers}
                                        showCollapseAllGroups={showCollapseAllGroups}
                                    />
                                )}
                            </Flex>
                        </SectionHeading>
                    }
                >
                    <TopLevelLayerList
                        map={map}
                        aria-label={intl.formatMessage({ id: "operationalLayerLabel" })}
                    />
                </TitledSection>
            </Box>
        </TocModelProvider>
    );

    return (
        <TocWidgetOptionsProvider value={options}>
            {basemapSwitcher}
            {layerList}
        </TocWidgetOptionsProvider>
    );
}

function useTocModel(): TocModel {
    const model = useMemo(() => {
        // Indexed by layerId
        const items = reactiveMap<string, TocItem>();
        return {
            getItem(layerId: string): TocItem | undefined {
                return items.get(layerId);
            },
            getItems(): TocItem[] {
                return Array.from(items.values());
            },
            registerItem(item: TocItem): void {
                if (items.has(item.layerId)) {
                    throw new Error(`Item with layerId '${item.layerId}' already registered.`);
                }
                items.set(item.layerId, item);
            },
            unregisterItem(item: TocItem): void {
                if (items.get(item.layerId) !== item) {
                    throw new Error(`Item with layerId '${item.layerId}' not registered.`);
                }
                items.delete(item.layerId);
            }
        };
    }, []);
    return model;
}
