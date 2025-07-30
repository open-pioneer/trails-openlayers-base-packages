// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BasemapSwitcher, BasemapSwitcherProps } from "@open-pioneer/basemap-switcher";
import { Box, Flex, Spacer, Text } from "@chakra-ui/react";
import { MapModel, MapModelProps, useMapModel } from "@open-pioneer/map";
import {
    CommonComponentProps,
    SectionHeading,
    TitledSection,
    useCommonComponentProps,
    useEvent
} from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, ReactNode, useEffect, useId, useRef } from "react";
import {
    createOptions,
    TocApi,
    TocApiImpl,
    TocDisposedHandler,
    TocModel,
    TocModelProvider,
    TocReadyHandler
} from "../model";
import { TopLevelLayerList } from "./LayerList/LayerList";
import { Tools } from "./Tools";

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
     * Property `mapId` is not applied (the basemap switcher uses the same map as the toc).
     */
    basemapSwitcherProps?: Omit<BasemapSwitcherProps, "mapId">;

    /**
     * If `true`, groups in the toc can be collapsed and expanded.
     * This property should only be `true` if the map actually contains layer groups.
     *
     * Defaults to `false`.
     */
    collapsibleGroups?: boolean;

    /**
     * If `true` groups in the toc are collapsed initially.
     *
     * Defaults to `false`. If {@link collapsibleGroups} is `false` this property should also be `false`. Otherwise, only the top level layers will appear in the toc.
     */
    initiallyCollapsed?: boolean;

    /**
     * Show the parent layers when a child layer is made visible.
     *
     * Defaults to `true`.
     */
    autoShowParents?: boolean;

    /**
     * Callback that is triggered once when the Toc is initialized.
     * The Toc API can be accessed by the `api` property of the {@link TocReadyEvent}.
     */
    onReady?: TocReadyHandler;

    /**
     * Callback that is triggered once when the Toc is disposed and unmounted.
     */
    onDisposed?: TocDisposedHandler;
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
    const intl = useIntl();
    const { containerProps } = useCommonComponentProps("toc", props);
    const state = useMapModel(props);

    let content: ReactNode | null;
    switch (state.kind) {
        case "loading":
            content = null;
            break;
        case "rejected":
            content = <Text className="toc-error">{intl.formatMessage({ id: "error" })}</Text>;
            break;
        case "resolved": {
            const map = state.map;
            content = <TocContent {...props} map={map} onReady={props.onReady} />;
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
        onReady,
        onDisposed
    } = props;
    const intl = useIntl();
    const model = useTocModel(props);
    useTocAPI(model, onReady, onDisposed);

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
                    <SectionHeading size="sm">
                        <Flex>
                            <Text>
                                {intl.formatMessage({
                                    id: "operationalLayerLabel"
                                })}
                            </Text>
                            <Spacer />
                            {showTools && <Tools map={map} {...toolsConfig} />}
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
    );

    return (
        <TocModelProvider value={model}>
            {basemapSwitcher}
            {layerList}
        </TocModelProvider>
    );
}

function useTocModel(props: TocProps): TocModel {
    const initialProps = useRef(props);
    const tocModelRef = useRef<TocModel>(null);
    if (!tocModelRef.current) {
        tocModelRef.current = new TocModel(
            createOptions(
                initialProps.current.autoShowParents,
                initialProps.current.collapsibleGroups,
                initialProps.current.initiallyCollapsed
            )
        );
    }

    // Sync props to model
    useEffect(() => {
        tocModelRef.current!.updateOptions(
            createOptions(props.autoShowParents, props.collapsibleGroups, props.initiallyCollapsed)
        );
    }, [
        props.autoShowParents,
        props.collapsibleGroups,
        props.initiallyCollapsed,
        tocModelRef.current.options
    ]);
    return tocModelRef.current;
}

function useTocAPI(
    model: TocModel,
    onReady: TocReadyHandler | undefined,
    onDisposed: TocDisposedHandler | undefined
) {
    const apiRef = useRef<TocApi>(null);
    if (!apiRef.current) {
        apiRef.current = new TocApiImpl(model);
    }

    const api = apiRef.current;

    const readyTrigger = useEvent(() => {
        onReady?.({
            api
        });
    });

    const disposeTrigger = useEvent(() => {
        onDisposed?.({});
    });

    // Trigger ready / dispose on mount / unmount, but if the callbacks change.
    // useEvent() returns a stable function reference.
    useEffect(() => {
        readyTrigger();
        return disposeTrigger;
    }, [readyTrigger, disposeTrigger]);
}
