// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    chakra,
    createListCollection,
    Flex,
    Icon,
    Portal,
    Select,
    VStack
} from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { MapModel, MapModelProps, useMapModel } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import { Geometry } from "ol/geom";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { DragController } from "./DragController";
import { SelectionController } from "./SelectionController";
import { SelectionResult, SelectionSource, SelectionSourceStatusObject } from "./api";

/**
 * Properties supported by the {@link Selection} component.
 */
export interface SelectionProps extends CommonComponentProps, MapModelProps {
    /**
     * Array of selection sources available for spatial selection.
     */
    sources: SelectionSource[];

    /**
     * This handler is called whenever the user has successfully selected
     * some items.
     */
    onSelectionComplete?(event: SelectionCompleteEvent): void;

    /**
     * This handler is called whenever the user has changed the selected source
     */
    onSelectionSourceChanged?(event: SelectionSourceChangedEvent): void;
}

export interface SelectionCompleteEvent {
    /** The source that returned the {@link results}. */
    source: SelectionSource;

    /** Results selected by the user. */
    results: SelectionResult[];
}

export interface SelectionSourceChangedEvent {
    /** The new selected source */
    source: SelectionSource | undefined;
}

/**
 * A component that allows the user to perform a spatial selection on a given set of {@link SelectionSource}.
 */
export const Selection: FC<SelectionProps> = (props) => {
    const intl = useIntl();
    const { sources, onSelectionComplete, onSelectionSourceChanged } = props;
    const { containerProps } = useCommonComponentProps("selection", props);

    const [currentSource, setCurrentSource] = useCurrentSelectionSource(
        sources,
        onSelectionSourceChanged
    );

    const currentSourceStatus = useSourceStatus(currentSource);

    const mapState = useMapModel(props);
    const { onExtentSelected } = useSelectionController(
        mapState.map,
        sources,
        currentSource,
        onSelectionComplete
    );

    const isActive = currentSourceStatus.kind === "available";
    const hasSelectedSource = !!currentSource;

    useDragSelection(mapState.map, intl, onExtentSelected, isActive, hasSelectedSource);

    const getId = useSelectionSourceId();

    const sourceOptionsCollection = createListCollection({
        items: sources,
        isItemDisabled: () => {
            return false;
        },
        itemToString: (item) => item.label,
        itemToValue: (item) => getId(item)
    });

    let triggerItem;
    if (currentSource) {
        triggerItem = <SelectionSourceItem source={currentSource} />;
    } else {
        triggerItem = null;
    }

    return (
        <VStack {...containerProps} gap={2}>
            <Select.Root
                className="selection-source"
                collection={sourceOptionsCollection}
                value={currentSource ? [getId(currentSource)] : undefined}
                onValueChange={(option) => option && setCurrentSource(option.items[0])}
                lazyMount={true}
                unmountOnExit={true}
            >
                <Select.Label>{intl.formatMessage({ id: "selectSource" })}</Select.Label>

                <Select.Control>
                    <Select.Trigger aria-description={intl.formatMessage({ id: "tooltip" })}>
                        <Select.ValueText
                            placeholder={intl.formatMessage({ id: "selectionPlaceholder" })}
                        >
                            {triggerItem}
                        </Select.ValueText>
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                        <Select.Indicator /> 
                    </Select.IndicatorGroup>
                </Select.Control>

                <Portal>
                    <Select.Positioner>
                        <Select.Content className="selection-source-options">
                            {sourceOptionsCollection.items.map((item) => (
                                <SelectionSourceItemContent item={item} key={getId(item)} />
                            ))}
                        </Select.Content>
                    </Select.Positioner>
                </Portal>
            </Select.Root>
        </VStack>
    );
};

type GetSelectionSourceId = (selectionSource: SelectionSource) => string;

/**
 * Assigns unique IDs to selection sources.
 */
function useSelectionSourceId(): GetSelectionSourceId {
    const sourceIds = useRef<WeakMap<SelectionSource, string>>(undefined);
    const counter = useRef(0);
    if (!sourceIds.current) {
        sourceIds.current = new WeakMap();
    }

    return useCallback((selectionSource: SelectionSource) => {
        const ids = sourceIds.current!;
        if (!ids.has(selectionSource)) {
            ids.set(selectionSource, `source-${counter.current++}`);
        }
        return ids.get(selectionSource)!;
    }, []);
}

function SelectionSourceItemContent(props: { item: SelectionSource }) {
    const { item } = props;

    const isDisabled = useSourceStatus(item).kind === "unavailable";

    return (
        <Select.Item
            className="selection-source-option"
            item={item}
            justifyContent="flex-start"
            // Override pointer-events: none rule for disabled items; we want to show the tooltip on hover
            pointerEvents="auto"
            aria-disabled={isDisabled ? "true" : undefined}
        >
            <SelectionSourceItem source={item} />
        </Select.Item>
    );
}

function useCurrentSelectionSource(
    sources: SelectionSource[],
    onSourceChanged: ((event: SelectionSourceChangedEvent) => void) | undefined
): [SelectionSource | undefined, (source: SelectionSource | undefined) => void] {
    const [currentSource, setCurrentSource] = useState<SelectionSource | undefined>(
        () => sources[0]
    );

    // Reset to undefined if the current source is not in the list of sources
    useEffect(() => {
        if (currentSource && !sources.includes(currentSource)) {
            setCurrentSource(undefined);
        }
    }, [sources, currentSource]);

    // Track the current source and notify the parent component if it changes
    const prevSelectedSource = useRef<SelectionSource | undefined>(undefined);
    useEffect(() => {
        if (currentSource !== prevSelectedSource.current) {
            prevSelectedSource.current = currentSource;
            onSourceChanged?.({ source: currentSource });
        }
    }, [currentSource, onSourceChanged]);
    return [currentSource, setCurrentSource];
}

/**
 * Hook to manage source option in selection-source react-select
 */
function SelectionSourceItem(props: { source: SelectionSource | undefined }) {
    const source = props.source;
    const label: string | undefined = source?.label;
    const status = useSourceStatus(source);
    const isAvailable = status.kind === "available";
    const clazz = isAvailable
        ? "selection-source-value"
        : "selection-source-value selection-source-value--disabled";

    return (
        <Flex className={clazz} direction="row" alignItems="center" grow={1}>
            {label}
            {status.kind === "unavailable" && (
                <Box ml={2}>
                    <Tooltip
                        content={status.reason}
                        positioning={{ placement: "right" }}
                        openDelay={500}
                    >
                        <chakra.span>
                            <Icon
                                color="red"
                                className="warning-icon"
                                aria-label={status.reason}
                                aria-hidden={undefined} // Overwrite icon default so the label gets read
                            >
                                <FiAlertTriangle />
                            </Icon>
                        </chakra.span>
                    </Tooltip>
                </Box>
            )}
        </Flex>
    );
}

/**
 * Hook to manage selection controller
 */
function useSelectionController(
    mapModel: MapModel | undefined,
    sources: SelectionSource[],
    currentSource: SelectionSource | undefined,
    onSelectionComplete: ((event: SelectionCompleteEvent) => void) | undefined
) {
    const notifier = useService<NotificationService>("notifier.NotificationService");
    const intl = useIntl();
    const [controller, setController] = useState<SelectionController | undefined>(undefined);
    useEffect(() => {
        if (!mapModel) {
            return;
        }
        const controller = new SelectionController({
            mapModel,
            onError() {
                notifier.notify({
                    level: "error",
                    message: intl.formatMessage({ id: "selectionFailed" })
                });
            }
        });
        setController(controller);
        return () => {
            controller.destroy();
        };
    }, [mapModel, notifier, sources, intl]);

    const onExtentSelected = useEvent(async (geometry: Geometry) => {
        if (!controller || !currentSource) {
            return;
        }

        const selectionResult = await controller.select(currentSource, geometry.getExtent());
        if (!selectionResult) {
            return;
        }

        onSelectionComplete?.(selectionResult);
    });
    return {
        controller,
        onExtentSelected
    };
}

type SimpleStatus =
    | {
          kind: "available";
      }
    | {
          kind: "unavailable";
          reason: string;
      };

function getSourceStatus(source: SelectionSource, sourceNotAvailableReason: string): SimpleStatus {
    const rawCurrent = source.status ?? "available";
    const current: SelectionSourceStatusObject =
        typeof rawCurrent === "string" ? { kind: rawCurrent } : rawCurrent;
    if (current.kind === "available") {
        return current;
    }

    return {
        kind: "unavailable",
        reason: current.reason ?? sourceNotAvailableReason
    };
}

/**
 * Hook to manage source status
 */
function useSourceStatus(source: SelectionSource | undefined): SimpleStatus {
    const intl = useIntl();
    const defaultNotAvailableMessage = intl.formatMessage({ id: "sourceNotAvailable" });
    const sourceStatus = useReactiveSnapshot((): SimpleStatus => {
        if (!source) {
            return { kind: "unavailable", reason: defaultNotAvailableMessage };
        }
        return getSourceStatus(source, defaultNotAvailableMessage);
    }, [source, defaultNotAvailableMessage]);
    return sourceStatus;
}

/**
 * Hook to manage map controls and tooltip
 */
function useDragSelection(
    map: MapModel | undefined,
    intl: PackageIntl,
    onExtentSelected: (geometry: Geometry) => void,
    isActive: boolean,
    hasSelectedSource: boolean
) {
    useEffect(() => {
        if (!map) {
            return;
        }

        const disabledMessage = hasSelectedSource
            ? intl.formatMessage({ id: "disabledTooltip" })
            : intl.formatMessage({ id: "noSourceTooltip" });

        const dragController = new DragController(
            map.olMap,
            intl.formatMessage({ id: "tooltip" }),
            disabledMessage,
            onExtentSelected
        );

        dragController.setActive(isActive);
        return () => {
            dragController?.destroy();
        };
    }, [map, intl, onExtentSelected, isActive, hasSelectedSource]);
}
