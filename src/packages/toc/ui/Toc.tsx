// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, Flex, Spacer, Text } from "@chakra-ui/react";
import { BasemapSwitcher, BasemapSwitcherProps } from "@open-pioneer/basemap-switcher";
import { MapModel, MapModelProps, useMapModelValue } from "@open-pioneer/map";
import {
    CommonComponentProps,
    SectionHeading,
    TitledSection,
    useCommonComponentProps,
    useEvent
} from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useEffect, useId } from "react";
import { TocApi, TocDisposedEvent, TocReadyEvent } from "../api";
import { TocViewModel } from "../model/TocViewModel";
import { TopLevelLayerList } from "./LayerList/LayerList";
import { Tools } from "./Tools";
import { useTocViewModel } from "./useTocViewModel";

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
     * The `map` property is not applied (the basemap switcher uses the same map as the toc).
     */
    basemapSwitcherProps?: Omit<BasemapSwitcherProps, "map">;

    /**
     * If `true`, groups in the toc can be collapsed and expanded.
     * This property should only be `true` if the map actually contains layer groups.
     *
     * Defaults to `true` if {@link initiallyCollapsed} is enabled, `false` otherwise.
     */
    collapsibleGroups?: boolean;

    /**
     * If `true` groups in the toc are collapsed initially.
     *
     * Defaults to `false`.
     */
    initiallyCollapsed?: boolean;

    /**
     * Show the parent layers when a child layer is made visible.
     *
     * Defaults to `true`.
     */
    autoShowParents?: boolean;

    /**
     * Callback that is triggered when the Toc is initialized.
     * The Toc API can be accessed by the `api` property of the {@link TocReadyEvent}.
     */
    onReady?: (event: TocReadyEvent) => void;

    /**
     * Callback that is triggered when the Toc is disposed, either because it is unmounted
     * or because the `map` changes.
     *
     * Old API objects should not be used anymore.
     */
    onDisposed?: (event: TocDisposedEvent) => void;
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

/**
 * Layer attributes to specifically configure how a layer is displayed in the Toc.
 */
export interface LayerTocAttributes {
    /**
     * The {@link ListMode} is used to hide the layer (or it's children) in the Toc.
     */
    listMode?: ListMode;
}

/**
 * ListMode determines if a layer item is displayed in the Toc for the layer.
 * The option `"hide-children"` provides a shortcut to hide all child layers (e.g. sublayers of group) of the layer in the Toc.
 * It has the same effect as manually setting the `listMode` to `"hide"` on all child layers.
 *
 * ListMode has precedence over the layer's `internal` attribute but specifically configures the layer's display in the Toc.
 */
export type ListMode = "show" | "hide" | "hide-children";

const PADDING = 2;

/**
 * Displays the layers of the configured map.
 */
export const Toc: FC<TocProps> = (props: TocProps) => {
    const { containerProps } = useCommonComponentProps("toc", props);
    const map = useMapModelValue(props);
    const viewModel = useTocViewModel(map, props);

    return (
        viewModel && (
            <Flex {...containerProps} direction="column" gap={PADDING}>
                <TocContent {...props} map={map} viewModel={viewModel} />
            </Flex>
        )
    );
};

/** This component is rendered once we have constructed the view model. */
function TocContent(props: TocProps & { map: MapModel; viewModel: TocViewModel }) {
    const {
        map,
        viewModel,
        showTools = false,
        toolsConfig,
        showBasemapSwitcher = true,
        basemapSwitcherProps,
        onReady,
        onDisposed
    } = props;
    const intl = useIntl();
    useTocAPI(viewModel, onReady, onDisposed);

    const basemapsHeadingId = useId();
    const basemapSwitcher = showBasemapSwitcher && (
        <Box className="toc-basemap-switcher" mb={PADDING}>
            <TitledSection
                title={
                    <SectionHeading id={basemapsHeadingId} size={"sm"} mb={PADDING}>
                        {intl.formatMessage({ id: "basemapsLabel" })}
                    </SectionHeading>
                }
            >
                <BasemapSwitcher
                    aria-labelledby={basemapsHeadingId}
                    {...basemapSwitcherProps}
                    map={map}
                />
            </TitledSection>
        </Box>
    );

    const layerList = (
        <Box className="toc-operational-layers">
            <TitledSection
                title={
                    <SectionHeading size="sm">
                        <Flex>
                            <Text>
                                {intl.formatMessage({
                                    id: "operationalLayerLabel"
                                })}
                            </Text>
                            <Spacer />
                            {showTools && <Tools viewModel={viewModel} {...toolsConfig} />}
                        </Flex>
                    </SectionHeading>
                }
            >
                <TopLevelLayerList
                    viewModel={viewModel}
                    aria-label={intl.formatMessage({ id: "operationalLayerLabel" })}
                />
            </TitledSection>
        </Box>
    );

    return (
        <>
            {basemapSwitcher}
            {layerList}
        </>
    );
}

function useTocAPI(
    model: TocViewModel,
    onReady: TocProps["onReady"] | undefined,
    onDisposed: TocProps["onDisposed"] | undefined
) {
    const readyTrigger = useEvent((api: TocApi) => {
        onReady?.({
            api
        });
    });

    const disposeTrigger = useEvent(() => {
        onDisposed?.({});
    });

    // The api lives as long as the view model, which is replaced when the map changes.
    // useEvent() returns stable function references, so changed callbacks do not re-run the effect.
    useEffect(() => {
        readyTrigger(new TocApi(model));
        return () => disposeTrigger();
    }, [model, readyTrigger, disposeTrigger]);
}
