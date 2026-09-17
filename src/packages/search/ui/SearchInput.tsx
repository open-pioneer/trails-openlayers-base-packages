// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import {
    CloseButton,
    Combobox,
    Icon,
    InputGroup,
    Portal,
    Spinner,
    VisuallyHidden
} from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { DISPATCH_SYNC, useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";
import { memo, UIEvent, useRef } from "react";
import { LuSearch } from "react-icons/lu";
import { SearchViewModel } from "../model";
import { SearchResults } from "./SearchResults";
import { getOptionValue, useComboboxCollection } from "./useComboboxCollection";
import { useSearchSourceId } from "./useSearchSourceId";

export interface SearchInputProps {
    viewModel: SearchViewModel;
    placeholder?: string;
}

export function SearchInput(props: SearchInputProps) {
    const { viewModel, placeholder } = props;
    const intl = useIntl();
    const controlRef = useRef<HTMLInputElement>(null);

    const inputValue = useReactiveSnapshot(() => viewModel.inputValue, [viewModel], DISPATCH_SYNC);
    const { pending, selectedResult } = useReactiveSnapshot(
        () => ({ pending: viewModel.pending, selectedResult: viewModel.selectedResult }),
        [viewModel]
    );

    // Create combobox options from the current search results, plus a list collection that holds them.
    const getSourceId = useSearchSourceId();
    const optionsCollection = useComboboxCollection(viewModel, getSourceId);
    const selectedValue = selectedResult
        ? getOptionValue(getSourceId, selectedResult.source, selectedResult.result)
        : undefined;

    return (
        <Combobox.Root
            collection={optionsCollection}
            onInputValueChange={(e) => {
                // Only update the input if the user actually typed something.
                // This keeps the input content if the user focuses another element or if the menu is closed.
                if (e.reason === "input-change" || e.reason === "interact-outside") {
                    viewModel.setInputValue(e.inputValue);
                }
            }}
            onValueChange={(e) => {
                const selectedItem = e.items.length ? e.items[0] : null;
                if (!selectedItem) {
                    return;
                }
                viewModel.selectResult(selectedItem.source, selectedItem.result, "user");
            }}
            inputValue={inputValue}
            value={selectedValue ? [selectedValue] : []}
            className="search-combobox-component"
            aria-label={intl.formatMessage({ id: "ariaLabel.search" })}
            placeholder={placeholder ?? intl.formatMessage({ id: "searchPlaceholder" })}
            openOnClick={inputValue.length > 0}
            closeOnSelect={true}
            lazyMount={true}
            unmountOnExit={true}
            selectionBehavior="preserve"
        >
            <AccessibleBoxHelper pending={pending} />
            <Combobox.Control>
                <InputGroup
                    startElement={
                        <Icon className={"search-icon"} size="md">
                            <LuSearch />
                        </Icon>
                    }
                >
                    <Combobox.Input ref={controlRef} />
                </InputGroup>
                <Combobox.IndicatorGroup>
                    {pending ? (
                        <Spinner size="xs" borderWidth="1px" />
                    ) : inputValue.length ? (
                        <ClearIndicator
                            clearValue={() => {
                                viewModel.clear("user");
                                controlRef.current?.focus();
                            }}
                        />
                    ) : null}
                </Combobox.IndicatorGroup>
            </Combobox.Control>

            <Portal>
                <Combobox.Positioner>
                    <SearchResults
                        collection={optionsCollection}
                        input={inputValue}
                        pending={pending}
                    />
                </Combobox.Positioner>
            </Portal>
        </Combobox.Root>
    );
}

/**
 * Report loading status for screen readers.
 */
const AccessibleBoxHelper = memo(function AccessibleBoxHelper(props: { pending: boolean }) {
    const { pending } = props;
    const intl = useIntl();

    let content: string;
    if (pending) {
        content = intl.formatMessage({ id: "loadingText" });
    } else {
        content = intl.formatMessage({ id: "resultLoaded" });
    }
    return <VisuallyHidden aria-live="polite">{content}</VisuallyHidden>;
});

const ClearIndicator = memo(function ClearIndicator(props: { clearValue: () => void }) {
    const intl = useIntl();
    const clearButtonLabel = intl.formatMessage({
        id: "ariaLabel.clearButton"
    });
    const clickHandler = (e: UIEvent) => {
        e.preventDefault();
        e.stopPropagation();
        props.clearValue();
    };

    return (
        <Tooltip content={clearButtonLabel}>
            <CloseButton
                variant="ghost"
                mr="-10px"
                size="sm"
                aria-label={clearButtonLabel}
                onClick={clickHandler}
                onTouchEnd={clickHandler}
            />
        </Tooltip>
    );
});
