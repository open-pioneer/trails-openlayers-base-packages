// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Combobox, Highlight, HStack, ListCollection, Span } from "@chakra-ui/react";
import { memo } from "react";
import { SearchOption, SearchResultsState } from "./useSearchState";
import { useIntl } from "open-pioneer:react-hooks";

export interface SearchResultsProps {
    collection: ListCollection<SearchOption>;
    input: string;
    results: SearchResultsState;
}

export const SearchResults = memo(function SearchResults(props: SearchResultsProps) {
    const { collection, input, results } = props;
    return (
        <Combobox.Content
            className="search-component-menu"
            minW="sm"
            maxH="300px"
            overflowY="auto"
            overflowX="hidden"
            visibility={input.length ? "visible" : "hidden"}
        >
            <FallbackContent results={results} />
            <SearchResultList collection={collection} input={input} results={results} />
        </Combobox.Content>
    );
});

const SearchResultList = memo(function SearchResults(props: SearchResultsProps) {
    const { collection, input, results } = props;
    return collection.group().map(([groupId, groupOptions], key) => {
        return (
            <Combobox.ItemGroup key={key}>
                <Combobox.ItemGroupLabel
                    key={groupId}
                    backgroundColor="colorPalette.100"
                    visibility={results.kind === "loading" ? "hidden" : "visible"}
                >
                    {groupOptions[0]?.group.label}
                </Combobox.ItemGroupLabel>
                {groupOptions.map((searchResult, key) => {
                    return (
                        <Combobox.Item
                            key={key}
                            item={searchResult}
                            css={{
                                _checked: {
                                    backgroundColor: "colorPalette.500",
                                    color: "white"
                                },
                                "&:hover:not([data-state=checked])": {
                                    backgroundColor: "colorPalette.50"
                                }
                            }}
                        >
                            <Combobox.ItemText>
                                <Highlight ignoreCase query={input} styles={{ fontWeight: "bold" }}>
                                    {searchResult.label}
                                </Highlight>
                            </Combobox.ItemText>
                        </Combobox.Item>
                    );
                })}
            </Combobox.ItemGroup>
        );
    });
});

/**
 * Show loading label or fallback message when no results are found.
 */
const FallbackContent = memo(function FallbackContent(props: { results: SearchResultsState }) {
    const { results } = props;
    const intl = useIntl();

    let content;
    if (results.kind === "loading") {
        content = intl.formatMessage({ id: "loadingText" });
    } else {
        content = intl.formatMessage({ id: "noOptionsText" });
    }

    return (
        <Combobox.Empty padding="0">
            <HStack p="2" justifyContent="center">
                <Span>{content}</Span>
            </HStack>
        </Combobox.Empty>
    );
});
