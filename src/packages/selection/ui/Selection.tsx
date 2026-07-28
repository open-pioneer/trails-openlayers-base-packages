// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createListCollection, Portal, Select, VStack } from "@chakra-ui/react";
import { MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useMemo } from "react";
import { SelectionResult, SelectionSource } from "../api";
import { SelectionViewModel } from "../model";
import { SelectionSourceItem } from "./SelectionSourceItem";
import { useSelectionSourceId } from "./useSelectionSourceId";
import { useSelectionViewModel } from "./useSelectionViewModel";
import { useSourceStatus } from "./useSourceStatus";

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
                value={currentSource ? [getSourceId(currentSource)] : []}
                onValueChange={(details) => {
                    const source = details.items[0];
                    if (source) {
                        viewModel.currentSource = source;
                    }
                }}
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
                                <SelectionSourceItemContent source={item} key={getSourceId(item)} />
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
function SelectionSourceItemContent(props: { source: SelectionSource }) {
    const { source } = props;
    const isDisabled = useSourceStatus(source).kind === "unavailable";
    return (
        <Select.Item
            className="selection-source-option"
            item={source}
            justifyContent="flex-start"
            // Override pointer-events: none rule for disabled items; we want to show the tooltip on hover
            pointerEvents="auto"
            aria-disabled={isDisabled ? "true" : undefined}
        >
            <SelectionSourceItem source={source} />
        </Select.Item>
    );
}
