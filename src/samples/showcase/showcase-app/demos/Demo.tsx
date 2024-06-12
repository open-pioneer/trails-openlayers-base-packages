// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ReadonlyReactive, reactive } from "@conterra/reactivity-core";
import { Box, Text } from "@open-pioneer/chakra-integration";
import { HttpService } from "@open-pioneer/http";
import { Legend } from "@open-pioneer/legend";
import { Highlight, Layer, MapModel, SimpleLayer } from "@open-pioneer/map";
import { OverviewMap } from "@open-pioneer/overview-map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import {
    FormatOptions,
    ResultColumn,
    ResultList,
    ResultListInput,
    ResultListSelectionChangeEvent
} from "@open-pioneer/result-list";
import { PackageIntl } from "@open-pioneer/runtime";
import { Search, SearchSelectEvent } from "@open-pioneer/search";
import { Selection, SelectionCompleteEvent, SelectionSource } from "@open-pioneer/selection";
import { VectorSelectionSourceFactory } from "@open-pioneer/selection/services";
import { Toc } from "@open-pioneer/toc";
import { Geometry } from "ol/geom";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import { useIntl } from "open-pioneer:react-hooks";
import { ReactNode, useId } from "react";
import { MAP_ID } from "../MapConfigProviderImpl";
import { PhotonGeocoder } from "../sources/PhotonGeocoderSearchSource";
import {
    createCoordinateViewerDemo,
    createScaleViewerDemo,
    createScaleBarDemo,
    createMeasurementDemo,
    createMapNavigationDemo,
    createGeolocationDemo,
    createSpatialBookmarksDemo,
    createPrintingDemo
} from "./SimpleDemos";

export interface Demo {
    /** Unique id */
    id: string;

    /** Human readable (and translated) title */
    title: string;

    /** Human readable description */
    description: string;

    /** Main widget to display in the app. */
    mainWidget?: ReactNode;

    /**
     * Tools that are shown next to the zoom buttons on the map.
     */
    tools?: ReactNode;

    /**
     * Method that is called if a demo is activated.
     */
    activate?: () => void;

    /**
     * Method that is called if a demo is deactivated.
     */
    deactivate?: () => void;
}

export interface Demo2 {
    /** Unique id */
    id: string;

    /** Human readable (and translated) title */
    title: string;

    /** Called by the application (and then rendered) when the demo is active. */
    createModel(): DemoModel;
}

export interface DemoModel {
    /** Human readable description */
    description: string;

    /** Main widget to display in the app. */
    mainWidget?: ReactNode;

    /**
     * Tools that are shown next to the zoom buttons on the map.
     */
    tools?: ReactNode;

    /** Cleanup any state used by the demo. Called when the demo is deselected in the application. */
    destroy?(): void;
}

interface ResultListState {
    /** Whether the result list is currently shown. */
    open: boolean;

    /** Incremented to reset result list state. */
    key: number;

    /** Input used for the result list component. */
    input: ResultListInput | undefined;
}

export interface SharedDemoOptions {
    intl: PackageIntl;
    httpService: HttpService;
    mapModel: MapModel;
    vectorSelectionSourceFactory: VectorSelectionSourceFactory;
}

export function createDemos(options: SharedDemoOptions): Demo[] {
    return [
        createTocAndBasemapSwitcherAndLegendDemo(options),
        createCoordinateViewerDemo(options),
        createScaleViewerDemo(options),
        createScaleBarDemo(options),
        createMeasurementDemo(options),

        // todo Editing
        createMapNavigationDemo(options),
        createGeolocationDemo(options),
        createSpatialBookmarksDemo(options),
        createOverviewMapDemo(options),
        createPrintingDemo(options),
        createSelectionAndResultListDemo(options),
        createSearchAndHighlightDemo(options)
    ];
}

function createTocAndBasemapSwitcherAndLegendDemo({ intl, mapModel }: SharedDemoOptions): Demo {
    function setDemoLayerVisible(visible: boolean = true): void {
        const layer = mapModel.layers.getLayerById("verwaltungsgebiete") as Layer;
        layer.setVisible(visible);
    }

    function resetDemoLayers(): void {
        setDemoLayerVisible(false);
        mapModel?.layers.activateBaseLayer("osm");
    }

    return {
        id: "tocLegend",
        activate: setDemoLayerVisible,
        deactivate: resetDemoLayers,
        title: intl.formatMessage({ id: "demos.tocLegend.title" }),
        description: intl.formatMessage({ id: "demos.tocLegend.description" }),
        mainWidget: <TocLegendView />
    };
}

function TocLegendView() {
    const tocTitleId = useId();
    const legendTitleId = useId();
    const intl = useIntl();

    return (
        <>
            <Box role="dialog" aria-labelledby={tocTitleId}>
                <TitledSection
                    title={
                        <SectionHeading id={tocTitleId} size="md" mb={2}>
                            <Text>
                                {intl.formatMessage({
                                    id: "demos.tocLegend.tocTitle"
                                })}
                            </Text>
                        </SectionHeading>
                    }
                >
                    {/*todo responsive design*/}
                    <Box overflowY="auto" maxHeight={200}>
                        <Toc
                            mapId={MAP_ID}
                            showTools={true}
                            basemapSwitcherProps={{
                                allowSelectingEmptyBasemap: true
                            }}
                        />
                    </Box>
                </TitledSection>
            </Box>
            <Box role="dialog" aria-labelledby={legendTitleId}>
                <TitledSection
                    title={
                        <SectionHeading id={legendTitleId} size="md" mb={2}>
                            {intl.formatMessage({
                                id: "demos.tocLegend.legendTitle"
                            })}
                        </SectionHeading>
                    }
                >
                    {/*todo responsive design*/}
                    <Box overflowY="auto" maxHeight={300}>
                        <Legend mapId={MAP_ID} showBaseLayers={true} />
                    </Box>
                </TitledSection>
            </Box>
        </>
    );
}

function createOverviewMapDemo({ intl }: SharedDemoOptions): Demo {
    const overviewMapLayer = new TileLayer({
        source: new OSM()
    });

    return {
        id: "overviewMap",
        title: intl.formatMessage({ id: "demos.overviewMap.title" }),
        description: intl.formatMessage({ id: "demos.overviewMap.description" }),
        mainWidget: <OverviewMap mapId={MAP_ID} olLayer={overviewMapLayer} />
    };
}

function createSelectionAndResultListDemo({
    intl,
    mapModel,
    vectorSelectionSourceFactory
}: SharedDemoOptions): Demo {
    const selectionSources = reactive<SelectionSource[]>([]);
    const resultListState = reactive<ResultListState>({ open: false, key: 0, input: undefined });

    function initSelection() {
        selectionSources.value = initSelectionSources(mapModel, vectorSelectionSourceFactory);

        const layer = mapModel.layers.getLayerById("krankenhaus") as Layer;
        layer.setVisible(true);
    }

    function cleanUp() {
        const layer = mapModel.layers.getLayerById("krankenhaus") as Layer;
        layer.setVisible(false);

        // todo empty (and close) resultList
        // todo highlights clean up
    }

    function onSelectionComplete(event: SelectionCompleteEvent) {
        const { source, results } = event;

        console.log(source);
        console.log(results);

        const formatOptions: FormatOptions = {
            numberOptions: {
                maximumFractionDigits: 3
            },
            dateOptions: {
                dateStyle: "medium",
                timeStyle: "medium",
                timeZone: "UTC"
            }
        };
        // todo add better column information (https://ogc-api-test.nrw.de/inspire-us-krankenhaus/v1/collections/governmentalservice/items?f=json)
        const columns: ResultColumn[] = [
            {
                propertyName: "thematicId",
                displayName: "ID",
                width: 120
            },
            {
                propertyName: "name",
                displayName: "Name"
            },
            {
                propertyName: "traeger",
                displayName: "Träger"
            }
        ];
        const input = {
            columns: columns,
            data: results,
            formatOptions: formatOptions
        };

        const oldKey = resultListState.value.key;
        const newResultListState = {
            open: true,
            key: oldKey + 1,
            input: input
        };
        resultListState.value = newResultListState;
    }

    function onResultListSelectionChange(event: ResultListSelectionChangeEvent) {
        // todo show highlight (delete old ones)
    }

    return {
        id: "selectionResultList",
        activate: initSelection,
        deactivate: cleanUp,
        title: intl.formatMessage({ id: "demos.selectionResultList.title" }),
        description: intl.formatMessage({ id: "demos.selectionResultList.description" }),
        mainWidget: (
            <>
                <SelectionComponent
                    onSelectionComplete={onSelectionComplete}
                    selectionSources={selectionSources}
                ></SelectionComponent>
                {/* todo new anchor point */}
                <ResultListComponent
                    resultListState={resultListState}
                    selectionChangeListener={onResultListSelectionChange}
                ></ResultListComponent>
            </>
        )
    };
}

function SelectionComponent(props: {
    onSelectionComplete: (evt: SelectionCompleteEvent) => void;
    selectionSources: ReadonlyReactive<SelectionSource[]>;
}) {
    const { onSelectionComplete, selectionSources } = props;

    const currentSources = useReactiveSnapshot(() => {
        return selectionSources.value;
    }, [selectionSources]);

    return (
        <Selection
            mapId={MAP_ID}
            sources={currentSources}
            onSelectionComplete={onSelectionComplete}
        />
    );
}

function ResultListComponent(props: {
    resultListState: ReadonlyReactive<ResultListState>;
    selectionChangeListener: (evt: ResultListSelectionChangeEvent) => void;
}) {
    const { resultListState, selectionChangeListener } = props;
    const currentState = useReactiveSnapshot(() => {
        return resultListState.value;
    }, [resultListState]);

    // add close button
    return (
        currentState.input && (
            <Box
                className="result-list-container"
                position="absolute"
                visibility={currentState.open ? "visible" : "hidden"}
                bottom="0"
                backgroundColor="white"
                width="100%"
                height="400px"
                zIndex={1}
                borderTop="2px solid"
                borderBottom="2px solid"
                borderColor={"trails.100"}
            >
                <ResultList
                    key={currentState.key}
                    input={currentState.input}
                    mapId={MAP_ID}
                    onSelectionChange={selectionChangeListener}
                />
            </Box>
        )
    );
}

function initSelectionSources(
    mapModel: MapModel,
    vectorSelectionSourceFactory: VectorSelectionSourceFactory
) {
    const opLayer = mapModel.layers.getLayerById("krankenhaus") as SimpleLayer;

    const layerSelectionSource = vectorSelectionSourceFactory.createSelectionSource({
        vectorLayer: opLayer.olLayer as VectorLayer<VectorSource>,
        label: opLayer.title
    });

    return [layerSelectionSource];
}

function createSearchAndHighlightDemo({ intl, httpService, mapModel }: SharedDemoOptions): Demo {
    const photonSource = new PhotonGeocoder("Photon Geocoder", ["city", "street"], httpService);
    let highlight: Highlight | undefined = undefined;

    function onSearchResultSelected(event: SearchSelectEvent) {
        const geometry = event.result.geometry;
        if (!geometry) {
            return;
        }

        highlight = highlightAndZoom(mapModel, [geometry], highlight);
    }

    function clearHighlight() {
        highlight?.destroy();
        highlight = undefined;
    }

    return {
        id: "searchAndHighlight",
        deactivate: clearHighlight,
        title: intl.formatMessage({ id: "demos.searchAndHighlight.title" }),
        description: intl.formatMessage({ id: "demos.searchAndHighlight.description" }),
        mainWidget: (
            <Search
                mapId={MAP_ID}
                sources={[photonSource]}
                onSelect={onSearchResultSelected}
                onClear={clearHighlight}
            />
        )
    };
}

function highlightAndZoom(
    map: MapModel,
    geometries: Geometry[],
    previousHighlight: Highlight | undefined
): Highlight {
    const viewport: HTMLElement = map.olMap.getViewport();

    clearPreviousHighlight(previousHighlight);
    return map.highlightAndZoom(geometries, {
        viewPadding:
            viewport && viewport.offsetWidth < 1000
                ? { top: 150, right: 75, bottom: 50, left: 75 }
                : { top: 150, right: 400, bottom: 50, left: 400 }
    });
}

function clearPreviousHighlight(highlight: Highlight | undefined) {
    highlight?.destroy();
}
