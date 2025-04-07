// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive, reactiveMap } from "@conterra/reactivity-core";
import { BasemapSwitcher, BasemapSwitcherProps } from "@open-pioneer/basemap-switcher";
import { Box, Flex, Spacer, Text, useConst } from "@open-pioneer/chakra-integration";
import { MapModel, MapModelProps, useMapModel } from "@open-pioneer/map";
import {
    CommonComponentProps,
    SectionHeading,
    TitledSection,
    useCommonComponentProps
} from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, ReactNode, useEffect, useId, useRef } from "react";
import { TocItem, TocModel, TocModelProvider, TocWidgetOptions } from "../model/TocModel";
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


    onTocEvent?: (event: TocEvent) => void
}

export type TocEvent = TocLoadingEvent | TocRejectedEvent | TocResolvedEvent

export interface TocResolvedEvent{
    kind: "resolved"
    apiRef: TocAPI
}

export interface TocLoadingEvent{
    kind: "loading"
}

export interface TocRejectedEvent{
    kind: "rejected"
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
 * API to manipulate the layer items of the Toc
 */
export interface TocAPI {
    /**
     * Expands or collapses all layer items in the Toc
     */
    setAllItemsExpanded(expanded: boolean): void;

    /**
     * Expands or collapses a singel layer item in the Toc.
     * Returns the `true` if the new state is expanded, `false` if the new state is collapsed or `undefined` if no layer id corresponding to {@link layerId}
     * @param layerId ID of the layer that corresponds to the layer item in the Toc
     * @param options
     */
    setItemExpanded(
        layerId: string,
        expanded: boolean,
        options: ItemExpandedOptions
    ): boolean | void;

    /**
     * Toggles expanded state of a single layer item.
     * Returns the `true` if the new state is expanded, `false` if the new state is collapsed or `undefined` if no layer id corresponding to {@link layerId}
     * @param layerId ID of the layer that corresponds to the layer item in the Toc
     * @param options
     */
    toggleItemExpanded(layerId: string, options: ItemExpandedOptions): boolean | undefined;

    /**
     * Returns the `true` if the current state is expanded, `false` if the current state is collapsed or `undefined` if no layer id corresponding to {@link layerId}
     * @param layerId ID of the layer that corresponds to the layer item in the Toc
     */
    isItemExpanded(layerId: string): boolean | undefined;
}

export interface ItemExpandedOptions {
    /**
     * if `true` parent items will automatically receive the same state as the manipulated layer item.
     */
    alignParents?: boolean;
}

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
            if(props.onTocEvent){
                props.onTocEvent({kind: "loading"});
            }
            break;
        case "rejected":
            content = <Text className="toc-error">{intl.formatMessage({ id: "error" })}</Text>;
            if(props.onTocEvent){
                props.onTocEvent({kind: "rejected"});
            }
            break;
        case "resolved": {
            const map = state.map;
            content = <TocContent {...props} map={map} onTocEvent={props.onTocEvent}/>;
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
function TocContent(
    props: TocProps & { map: MapModel; onTocEvent?: (event: TocEvent) => void }
) {
    const {
        map,
        showTools = false,
        toolsConfig,
        showBasemapSwitcher = true,
        basemapSwitcherProps,
        onTocEvent: onAPIReady
    } = props;
    const intl = useIntl();
    const model = useTocModel(props);
    const api = useTocAPI(map, model);

    useEffect(() => {
        if(onAPIReady){
            onAPIReady({kind: "resolved", apiRef: api });
        }
    },[onAPIReady, api]);

    const basemapsHeadingId = useId();
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
    const tocModelRef = useConst(createTocModel());

    function createTocModel(){
        const options = reactive<TocWidgetOptions>(
            createOptions(
                initialProps.current.autoShowParents,
                initialProps.current.collapsibleGroups,
                initialProps.current.initiallyCollapsed
            )
        );

        // Indexed by layerId
        const items = reactiveMap<string, TocItem>();
        const model: TocModel = {
            get options() {
                return options.value;
            },
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
        return { model: model, options: options };
    }

    // Sync props to model
    useEffect(() => {
        tocModelRef.options.value = createOptions(
            props.autoShowParents,
            props.collapsibleGroups,
            props.initiallyCollapsed
        );
    }, [props.autoShowParents, props.collapsibleGroups, props.initiallyCollapsed, tocModelRef.options]);

    return tocModelRef.model;
}

function createOptions(
    autoShowParents?: boolean | undefined,
    collapsibleGroups?: boolean | undefined,
    isCollapsed?: boolean | undefined
): TocWidgetOptions {
    return {
        autoShowParents: autoShowParents ?? true,
        collapsibleGroups: collapsibleGroups ?? false,
        initiallyCollapsed: isCollapsed ?? false
    };
}

function useTocAPI(map: MapModel, model: TocModel): TocAPI {
    const apiRef = useConst<TocAPI>({
        setAllItemsExpanded: function (expanded: boolean): void {
            model.getItems().forEach((item) => item.setExpanded(expanded));
        },
        setItemExpanded: function (
            layerId: string,
            expanded: boolean,
            options: ItemExpandedOptions
        ): boolean | undefined {
            const tocItem = model.getItem(layerId);
            if (tocItem) {
                tocItem.setExpanded(expanded);

                if (options.alignParents) {
                    bubbleExpandedState(layerId, expanded, map, model);
                }

                return expanded;
            } else {
                return undefined;
            }
        },
        toggleItemExpanded: function (
            layerId: string,
            options: ItemExpandedOptions
        ): boolean | undefined {
            const item = model.getItem(layerId);
            if (item) {
                const newState = !item.isExpanded;
                item.setExpanded(newState);

                if (options.alignParents) {
                    bubbleExpandedState(layerId, newState, map, model);
                }

                return newState;
            }
            return undefined;
        },
        isItemExpanded: function (layerId: string): boolean | undefined {
            const item = model.getItem(layerId);
            if (item) {
                return item.isExpanded;
            }
            return undefined;
        }
    }
    );

    return apiRef;
}

/**
 * sets new expanded state of a layer item to all its parent items
 * @param layerId
 * @param newState
 * @param map
 * @param model
 */
function bubbleExpandedState(layerId: string, newState: boolean, map: MapModel, model: TocModel) {
    let parent = map.layers.getLayerById(layerId)?.parent;
    while (parent) {
        const parentItem = model.getItem(parent.id);
        if (parentItem) {
            parentItem.setExpanded(newState);
        }
        parent = parent.parent;
    }
}
