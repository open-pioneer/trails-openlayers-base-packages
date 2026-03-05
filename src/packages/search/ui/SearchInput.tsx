// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    CloseButton,
    Combobox,
    ComboboxInputValueChangeDetails,
    ComboboxValueChangeDetails,
    createListCollection,
    Icon,
    InputGroup,
    Portal,
    Spinner,
    VisuallyHidden
} from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { useEvent } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { memo, UIEvent, useMemo, useRef } from "react";
import { LuSearch } from "react-icons/lu";
import { SearchClearEvent, SearchSelectEvent } from "../api";
import { SearchResults } from "./SearchResults";
import { SearchOption, SearchResultsState } from "./useSearchState";

export interface SearchInputProps {
    input: string;
    selectedOption?: SearchOption;
    results: SearchResultsState;
    placeholder?: string;

    onClear?: (event: SearchClearEvent) => void;
    onSelect?: (event: SearchSelectEvent) => void;
    onInputChanged: (newInput: string) => void;
    onOptionConfirmed: (option: SearchOption) => void;
}

export function SearchInput(props: SearchInputProps) {
    const {
        input,
        selectedOption,
        results,
        placeholder,
        onClear,
        onSelect,
        onInputChanged,
        onOptionConfirmed
    } = props;
    const intl = useIntl();
    const controlRef = useRef<HTMLInputElement>(null);

    // Create the collection for the combobox and keep it synced with search results.
    const collection = useSearchCollection(results);

    // Event hooks for handling input changes and selecting options
    const { handleInputChange, handleSelectChange } = useSearchHandlers(
        onInputChanged,
        onOptionConfirmed,
        onSelect
    );

    return (
        <Combobox.Root
            collection={collection}
            onInputValueChange={(e) => {
                handleInputChange(e);
            }}
            onValueChange={(e) => {
                handleSelectChange(e);
            }}
            inputValue={input}
            value={selectedOption?.value ? [selectedOption.value] : []}
            className="search-combobox-component"
            aria-label={intl.formatMessage({ id: "ariaLabel.search" })}
            placeholder={placeholder ?? intl.formatMessage({ id: "searchPlaceholder" })}
            openOnClick={input.length > 0}
            closeOnSelect={true}
            lazyMount={true}
            unmountOnExit={true}
            selectionBehavior="preserve"
        >
            <AccessibleBoxHelper search={results} />
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
                    {results.kind === "loading" ? (
                        <Spinner size="xs" borderWidth="1px" />
                    ) : input.length ? (
                        <ClearIndicator
                            clearValue={() => {
                                onInputChanged("");
                                onClear?.({ trigger: "user" });
                                controlRef.current?.focus();
                            }}
                        />
                    ) : null}
                </Combobox.IndicatorGroup>
            </Combobox.Control>

            <Portal>
                <Combobox.Positioner>
                    <SearchResults collection={collection} input={input} results={results} />
                </Combobox.Positioner>
            </Portal>
        </Combobox.Root>
    );
}

/**
 * Report loading status for screen readers.
 */
const AccessibleBoxHelper = memo(function AccessibleBoxHelper(props: {
    search: SearchResultsState;
}) {
    const { search } = props;
    const intl = useIntl();

    let content;
    if (search.kind === "loading") {
        content = intl.formatMessage({ id: "loadingText" });
    } else if (search.kind === "ready") {
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

function useSearchCollection(results: SearchResultsState) {
    return useMemo(() => {
        if (results.kind === "ready") {
            const options = results.results.flatMap((group) => group.options);
            return createListCollection({
                items: options,
                groupBy: (item) => item.group.id,
                itemToString: (item) => item?.label || "",
                itemToValue: (item) => item?.value || ""
            });
        }
        return createListCollection<SearchOption>({ items: [] });
    }, [results]);
}

function useSearchHandlers(
    onInputChanged: (newValue: string) => void,
    onOptionConfirmed: (option: SearchOption) => void,
    onSelect: ((event: SearchSelectEvent) => void) | undefined
) {
    const handleInputChange = useEvent((e: ComboboxInputValueChangeDetails) => {
        // Only update the input if the user actually typed something.
        // This keeps the input content if the user focuses another element or if the menu is closed.
        if (e.reason === "input-change" || e.reason === "interact-outside") {
            onInputChanged(e.inputValue);
        }
    });

    const handleSelectChange = useEvent((e: ComboboxValueChangeDetails<SearchOption>) => {
        const selectedItem = e.items.length ? e.items[0] : null;
        if (!selectedItem) {
            return;
        }
        onOptionConfirmed(selectedItem);
        onSelect?.({
            source: selectedItem.source,
            result: selectedItem.result
        });
    });

    return { handleInputChange, handleSelectChange };
}
