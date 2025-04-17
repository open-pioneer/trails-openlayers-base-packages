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
import {
    TocItem,
    TocModel,
    TocModelProvider,
    TocWidgetOptions,
    TocAPI,
    TocAPIDisposedError
} from "../model/TocModel";
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

    onApiReady?: (event: TocApiReadyEvent) => void;
}

export interface TocApiReadyEvent {
    apiRef: TocAPI;
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
            break;
        case "rejected":
            content = <Text className="toc-error">{intl.formatMessage({ id: "error" })}</Text>;
            break;
        case "resolved": {
            const map = state.map;
            content = <TocContent {...props} map={map} onApiReady={props.onApiReady} />;
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
    props: TocProps & { map: MapModel; onTocEvent?: (event: TocApiReadyEvent) => void }
) {
    const {
        map,
        showTools = false,
        toolsConfig,
        showBasemapSwitcher = true,
        basemapSwitcherProps,
        onApiReady: onAPIReady
    } = props;
    const intl = useIntl();
    const model = useTocModel(props);
    const api = useTocAPI(model);

    useEffect(() => {
        if (onAPIReady) {
            model.disposed = false;
            onAPIReady({ apiRef: api });
        }

        return () => {
            //dispose api when toc is unmounted
            model.disposed = true;
            console.log(model.disposed);
        };
    }, [onAPIReady, api, model]);

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

    function createTocModel() {
        const options = reactive<TocWidgetOptions>(
            createOptions(
                initialProps.current.autoShowParents,
                initialProps.current.collapsibleGroups,
                initialProps.current.initiallyCollapsed
            )
        );

        // Indexed by layerId
        const items = reactiveMap<string, TocItem>();
        const tocModelDisposed = reactive(false);
        console.log("create: " + tocModelDisposed);
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
            },
            get disposed(): boolean {
                return tocModelDisposed.value;
            },
            set disposed(isDisposed: boolean) {
                tocModelDisposed.value = isDisposed;
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
    }, [
        props.autoShowParents,
        props.collapsibleGroups,
        props.initiallyCollapsed,
        tocModelRef.options
    ]);

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

function useTocAPI(model: TocModel): TocAPI {
    const apiRef = useConst<TocAPI>(
        //use anonymous class for "this" accessor
        new (class implements TocAPI {
            private tocModel: TocModel = model;

            get options() {
                return this.getTocModelOrThrowDisposedError().options;
            }

            getItem(layerId: string): TocItem | undefined {
                return this.getTocModelOrThrowDisposedError().getItem(layerId);
            }

            getItems(): TocItem[] {
                return this.getTocModelOrThrowDisposedError().getItems();
            }

            get disposed(): boolean {
                return this.tocModel.disposed;
            }

            private getTocModelOrThrowDisposedError() {
                if (!this.tocModel.disposed) {
                    return this.tocModel;
                } else {
                    throw new TocAPIDisposedError("cannot use Toc API, Toc API is disposed");
                }
            }
        })()
    );

    return apiRef;
}
