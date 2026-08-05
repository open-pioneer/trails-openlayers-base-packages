// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { reactive } from "@conterra/reactivity-core";
import { setupMap } from "@open-pioneer/map-test-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { disableReactActWarnings } from "test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchClearEvent, SearchReadyEvent, SearchSelectEvent, SearchSource } from "../api";
import { FakeCitySource, FakeRiverSource, FakeStreetSource } from "../testSources";
import { Search } from "./Search";

beforeEach(() => {
    disableReactActWarnings();
});

it("should successfully create a search component", async () => {
    await createSearch();
    const { searchDiv } = await waitForSearch();
    expect(searchDiv).toMatchSnapshot();
});

it("should render one group per search source", async () => {
    const user = userEvent.setup();
    await createSearch();

    const { searchInput } = await waitForInput();
    // "e" matches results in all three sources.
    await inputText(user, searchInput, "e");

    await waitFor(async () => {
        expect(await getGroupLabels()).toEqual(["Cities", "Rivers", "Streets"]);
    });

    const values = (await getOptionValues()).filter((value) => value != null);
    expect(values.length).toBeGreaterThan(3);
    expect(new Set(values).size).toBe(values.length); // all ids are unique; no duplicates
});

it("should use the new sources when the sources prop changes", async () => {
    const user = userEvent.setup();
    const { sources } = await createSearch();

    const { searchInput } = await waitForInput();
    await inputText(user, searchInput, "e");
    await waitFor(async () => {
        expect(await getGroupLabels()).toEqual(["Cities", "Rivers", "Streets"]);
    });

    // NOTE: The results of the current search are kept; the next search uses the new sources.
    sources.value = [new FakeRiverSource(1)];
    await inputText(user, searchInput, "rh");

    await waitFor(async () => {
        expect(await getGroupLabels()).toEqual(["Rivers"]);
    });
    expect(searchInput).toHaveValue("rh");
});

it("should announce the loading state to screen readers", async () => {
    await createSearch();
    const { searchDiv } = await waitForSearch();

    // The live region must exist right from the start, otherwise updates are not announced.
    const liveRegion = searchDiv.querySelector("[aria-live=polite]");
    expect(liveRegion).not.toBeNull();
    expect(liveRegion).toHaveTextContent("resultLoaded");
});

it("should successfully call select handler after clicking a suggestion", async () => {
    const user = userEvent.setup();

    const selectHandler = vi.fn();
    const { sources } = await createSearch({ onSelect: selectHandler });
    const citySource = sources.value[0]!;

    const { searchInput } = await waitForInput();
    await inputText(user, searchInput, "Dort");

    const { suggestion } = await waitForSuggestion("Dort");
    await userEvent.click(suggestion);

    expect(searchInput).toHaveValue("Dortmund");
    expect(selectHandler).toHaveBeenCalledWith({
        "source": citySource,
        "result": {
            "id": 0,
            "label": "Dortmund"
        },
        "trigger": "user"
    });
});

it("should show a spinner while searching and the clear button afterwards", async () => {
    const user = userEvent.setup();
    await createSearch({ searchTypingDelay: 300 });

    const { searchDiv, searchInput } = await waitForInput();
    await inputText(user, searchInput, "Dortmund");

    // The search is still being delayed: the clear button is replaced by the spinner.
    expect(searchDiv.querySelector(".chakra-spinner")).not.toBeNull();
    expect(screen.queryByLabelText("ariaLabel.clearButton")).toBeNull();

    await waitForClearButton();
    expect(searchDiv.querySelector(".chakra-spinner")).toBeNull();
});

it("should clear the input after a suggestion has been selected", async () => {
    const user = userEvent.setup();
    const clearHandler = vi.fn();

    await createSearch({ onClear: clearHandler });
    const { searchInput } = await waitForInput();
    const cityName = "Dortmund";
    await inputText(user, searchInput, cityName);

    const { suggestion } = await waitForSuggestion(cityName);
    await userEvent.click(suggestion);

    const { clearButton } = await waitForClearButton();
    await userEvent.click(clearButton);

    expect(searchInput).toHaveValue("");
    expect(clearHandler).toHaveBeenCalledTimes(1);
    expect(clearHandler).toHaveBeenCalledWith({ trigger: "user" });
});

it("should clear the typed input if no suggestion has been selected", async () => {
    const user = userEvent.setup();
    const clearHandler = vi.fn();

    await createSearch({ onClear: clearHandler });
    const { searchInput } = await waitForInput();
    await inputText(user, searchInput, "Dortmund");
    expect(searchInput).toHaveValue("Dortmund");

    const { clearButton } = await waitForClearButton();
    await userEvent.click(clearButton);

    expect(searchInput).toHaveValue("");
    expect(clearHandler).toHaveBeenCalledTimes(1);
    expect(clearHandler).toHaveBeenCalledWith({ trigger: "user" });
});

describe("search api", () => {
    it("should call onReady event and return a SearchApi", async () => {
        let readyEvent: SearchReadyEvent | undefined;
        const readyMock = vi.fn((e: SearchReadyEvent) => {
            readyEvent = e;
        });

        await createSearch({ onReady: readyMock });
        await waitForSearch();

        await waitFor(() => {
            expect(readyMock).toHaveBeenCalledTimes(1);
        });
        expect(readyEvent?.api).toBeDefined();
    });

    it("should support using the api right away in the onReady event", async () => {
        // The search API must be usable as soon as it is handed out.
        await createSearch({ onReady: (e) => e.api.setInputValue("Dortmund") });
        const { searchInput } = await waitForInput();

        await waitFor(() => {
            expect(searchInput).toHaveValue("Dortmund");
        });
    });

    it("should call onDisposed event when search is disposed", async () => {
        const disposedMock = vi.fn();

        const { unmount } = await createSearch({ onDisposed: disposedMock });
        await waitForSearch();

        expect(disposedMock).toHaveBeenCalledTimes(0);

        unmount();

        await waitFor(() => {
            expect(disposedMock).toHaveBeenCalledTimes(1);
        });
    });

    it("should reset input when resetInput is called on the search api", async () => {
        const user = userEvent.setup();

        let clearEvent: SearchClearEvent | undefined;
        const clearHandler = vi.fn((e: SearchClearEvent) => {
            clearEvent = e;
        });

        let readyEvent: SearchReadyEvent | undefined;
        const readyMock = vi.fn((e: SearchReadyEvent) => {
            readyEvent = e;
        });

        await createSearch({ onClear: clearHandler, onReady: readyMock });

        const { searchInput } = await waitForInput();
        const cityName = "Dortmund";
        await inputText(user, searchInput, cityName);
        expect(searchInput).toHaveValue(cityName);

        // reset the input using the SearchApi
        readyEvent?.api.resetInput();

        await waitFor(() => {
            expect(searchInput).toHaveValue("");
        });
        expect(readyMock).toHaveBeenCalledTimes(1);
        expect(clearEvent).toEqual({ trigger: "api-reset" });
        expect(clearHandler).toHaveBeenCalledTimes(1);
    });

    it("should replace the input value when setInputValue is called", async () => {
        const user = userEvent.setup();

        const selectHandler = vi.fn();
        let readyEvent: SearchReadyEvent | undefined;
        const readyHandler = (e: SearchReadyEvent) => {
            readyEvent = e;
        };

        await createSearch({ onSelect: selectHandler, onReady: readyHandler });
        const { searchInput } = await waitForInput();
        const cityName = "Dortmund";

        // Normal typing + selection --> menu closes after selection
        await inputText(user, searchInput, cityName);
        expect(searchInput).toHaveValue(cityName);
        const { suggestion } = await waitForSuggestion(cityName);
        await userEvent.click(suggestion);

        // Change current value: menu does not open
        const title2 = "Bonn";
        readyEvent?.api.setInputValue(title2);

        // input value is replaced
        await waitFor(() => {
            expect(searchInput).toHaveValue(title2);
        });

        // do not trigger any actions
        await expect(waitForMenu(50)).rejects.toThrow("Menu not found");
        expect(selectHandler).toHaveBeenCalledTimes(1); // only Dortmund selection
    });

    it("should search and select the first matching result when searchAndSelect is called", async () => {
        const onSelect = vi.fn();

        let readyEvent: SearchReadyEvent | undefined;
        await createSearch({
            onSelect,
            onReady: (e) => {
                readyEvent = e;
            }
        });

        const { searchInput } = await waitForInput();

        const selection = await readyEvent!.api.searchAndSelect("Dortmund");

        await waitFor(() => {
            expect(searchInput).toHaveValue("Dortmund");
            expect(onSelect).toHaveBeenCalled();
        });

        expect(selection?.result).toEqual({
            id: 0,
            label: "Dortmund"
        });
        expect(onSelect).toHaveBeenCalledOnce();
        expect(onSelect).toHaveBeenCalledWith(
            expect.objectContaining({
                result: expect.objectContaining({
                    label: "Dortmund"
                }),
                trigger: "api-select"
            })
        );
    });
});

interface CreateSearchOptions {
    onSelect?: (event: SearchSelectEvent) => void;
    onClear?: (event: SearchClearEvent) => void;
    onReady?: (event: SearchReadyEvent) => void;
    onDisposed?: () => void;

    /** Defaults to a short delay to keep the tests fast. */
    searchTypingDelay?: number;
}

async function createSearch(options?: CreateSearchOptions) {
    const { map } = await setupMap();

    const sources = reactive<SearchSource[]>([
        new FakeCitySource(1),
        new FakeRiverSource(1),
        new FakeStreetSource(1)
    ]);

    function SearchComponent() {
        const currentSources = useReactiveSnapshot(() => sources.value, []);
        return (
            <Search
                data-testid="search"
                map={map}
                sources={currentSources}
                searchTypingDelay={options?.searchTypingDelay ?? 10}
                onSelect={options?.onSelect ?? (() => {})}
                onClear={options?.onClear ?? (() => {})}
                onReady={options?.onReady ?? (() => {})}
                onDisposed={options?.onDisposed ?? (() => {})}
            />
        );
    }

    const { unmount } = render(
        <PackageContextProvider>
            <SearchComponent />
        </PackageContextProvider>
    );

    return {
        sources,
        unmount
    };
}

// Faster than simulation via user.type()
async function inputText(user: UserEvent, element: HTMLInputElement, text: string) {
    element.value = "";
    await user.click(element);
    await user.paste(text);
}

async function waitForSearch() {
    const searchDiv = await screen.findByTestId<HTMLDivElement>("search");
    return { searchDiv };
}

async function waitForMenu(timeout?: number) {
    const menuDiv = await waitFor(
        () => {
            const menuDiv = document.body.querySelector(".search-component-menu");
            if (!menuDiv) {
                throw new Error("Menu not found");
            }
            return menuDiv as HTMLElement;
        },
        {
            timeout: timeout
        }
    );
    return { menuDiv };
}

async function waitForInput() {
    const { searchDiv } = await waitForSearch();
    const searchInput = searchDiv.getElementsByTagName("input")[0];
    if (!searchInput) {
        throw new Error("input not rendered");
    }
    return { searchDiv, searchInput };
}

async function waitForSuggestion(title: string, timeout?: number) {
    const { suggestion } = await waitFor(
        async () => {
            const { menuDiv } = await waitForMenu();
            const markElements = menuDiv.getElementsByTagName("mark");
            const suggestion = Array.from(markElements).find(
                (el) => el.textContent?.trim() === title
            );

            if (!suggestion) {
                throw new Error("Suggestion not found");
            }
            return { suggestion };
        },
        {
            timeout: timeout
        }
    );
    return { suggestion };
}

async function getGroupLabels() {
    const { menuDiv } = await waitForMenu();
    return Array.from(menuDiv.querySelectorAll(".chakra-combobox__itemGroupLabel")).map(
        (label) => label.textContent
    );
}

async function getOptionValues() {
    const { menuDiv } = await waitForMenu();
    return Array.from(menuDiv.querySelectorAll(".chakra-combobox__item")).map((option) =>
        option.getAttribute("data-value")
    );
}

async function waitForClearButton() {
    const searchDiv = await screen.findByTestId<HTMLDivElement>("search");
    const clearButton = await screen.findByLabelText(
        "ariaLabel.clearButton",
        {},
        { container: searchDiv }
    );
    return { clearButton };
}
