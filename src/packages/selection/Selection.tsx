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
import { MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useCallback, useMemo, useRef } from "react";
import { LuTriangleAlert } from "react-icons/lu";
import { SelectionResult, SelectionSource } from "./api";
import { getSourceStatus, SelectionViewModel, useSelectionViewModel } from "./view-model";

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
    const { sources, onSelectionComplete, onSelectionSourceChanged } = props;
    const map = useMapModelValue(props);
    const viewModel = useSelectionViewModel(
        map,
        sources,
        onSelectionComplete,
        onSelectionSourceChanged
    );
    return viewModel && <SelectionReady viewModel={viewModel} {...props} />;
};

function SelectionReady(props: CommonComponentProps & { viewModel: SelectionViewModel }) {
    const { viewModel } = props;
    const { containerProps } = useCommonComponentProps("selection", props);
    const intl = useIntl();

    // Subscribe to relevant view model state.
    const sources = useReactiveSnapshot(() => viewModel.sources, [viewModel]);
    const currentSource = useReactiveSnapshot(() => viewModel.currentSource, [viewModel]);
    const ariaMessage = useReactiveSnapshot(() => viewModel.ariaMessage, [viewModel]);

    // Translate sources array to a collection for chakra's select control.
    const getSourceId = useSelectionSourceId();
    const sourceOptionsCollection = useMemo(
        () =>
            createListCollection({
                items: sources,
                isItemDisabled: () => {
                    return false;
                },
                itemToString: (item) => item.label,
                itemToValue: (item) => getSourceId(item)
            }),
        [sources, getSourceId]
    );

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
                value={currentSource ? [getSourceId(currentSource)] : undefined}
                onValueChange={(option) => option && (viewModel.currentSource = option.items[0])}
                lazyMount={true}
                unmountOnExit={true}
            >
                <Select.Label>{intl.formatMessage({ id: "selectSource" })}</Select.Label>

                <Select.Control>
                    <Select.Trigger aria-description={ariaMessage}>
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
                                <SelectionSourceItemContent item={item} key={getSourceId(item)} />
                            ))}
                        </Select.Content>
                    </Select.Positioner>
                </Portal>
            </Select.Root>
        </VStack>
    );
}

/**
 * Renders a dropdown item in the menu.
 */
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

/**
 * Renders a selection source in the dropdown menu (option or current selection).
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
                                <LuTriangleAlert />
                            </Icon>
                        </chakra.span>
                    </Tooltip>
                </Box>
            )}
        </Flex>
    );
}

type SimpleStatus =
    | {
          kind: "available";
      }
    | {
          kind: "unavailable";
          reason: string;
      };

function useSourceStatus(source: SelectionSource | undefined): SimpleStatus {
    const intl = useIntl();
    const sourceStatus = useReactiveSnapshot((): SimpleStatus => {
        if (!source) {
            return {
                kind: "unavailable",
                reason: intl.formatMessage({ id: "sourceNotAvailable" })
            };
        }

        const status = getSourceStatus(source);
        if (status.kind === "available") {
            return status;
        }
        return {
            kind: "unavailable",
            reason: status.reason ?? intl.formatMessage({ id: "sourceNotAvailable" })
        };
    }, [source, intl]);
    return sourceStatus;
}

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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const ids = sourceIds.current!;
        if (!ids.has(selectionSource)) {
            ids.set(selectionSource, `source-${counter.current++}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return ids.get(selectionSource)!;
    }, []);
}
