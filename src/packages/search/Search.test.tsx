// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { Search } from "./Search";
import { SearchClearEvent, SearchReadyEvent, SearchSelectEvent } from "./api";
import { FakeCitySource, FakeRiverSource, FakeStreetSource } from "./testSources";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { disableReactActWarnings } from "test-utils";

beforeEach(() => {
    disableReactActWarnings();
});

it("should successfully create a search component", async () => {
    await createSearch();
    const { searchDiv } = await waitForSearch();
    expect(searchDiv).toMatchSnapshot();
});

it("should successfully type into search", async () => {
    const user = userEvent.setup();
    await createSearch();
    const { searchInput } = await waitForInput();
    await inputText(user, searchInput, "Dortmund");
    expect(searchInput).toHaveValue("Dortmund");
});

it("should successfully show a search suggestion", async () => {
    const user = userEvent.setup();
    await createSearch();

    const { searchInput } = await waitForInput();
    const cityName = "Dortmund";
    await inputText(user, searchInput, cityName);
    const { suggestion } = await waitForSuggestion(cityName);
    expect(suggestion).toHaveTextContent(cityName);
});

it("should successfully call select handler after clicking a suggestion", async () => {
    const user = userEvent.setup();

    const selectHandler = vi.fn();
    const { sources } = await createSearch(selectHandler);
    const citySource = sources[0]!;

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
        }
    });
});

it("should successfully clear a suggestion select", async () => {
    const user = userEvent.setup();

    const selectHandler = vi.fn();
    const clearHandler = vi.fn();

    await createSearch(selectHandler, clearHandler);
    const { searchInput } = await waitForInput();
    const cityName = "Dortmund";
    await inputText(user, searchInput, cityName);

    const { suggestion } = await waitForSuggestion(cityName);
    await userEvent.click(suggestion);
    const { clearButton } = await waitForClearButton();
    await userEvent.click(clearButton);
    expect(searchInput).toHaveValue("");
    expect(clearHandler).toBeCalledTimes(1);
});

it("should allow clearing the suggestion text even if no option has been selected", async () => {
    const user = userEvent.setup();

    const selectHandler = vi.fn();
    const clearHandler = vi.fn();

    await createSearch(selectHandler, clearHandler);
    const { searchInput } = await waitForInput();
    await inputText(user, searchInput, "Dortmund");
    expect(searchInput).toHaveValue("Dortmund");

    const { clearButton } = await waitForClearButton();
    await userEvent.click(clearButton);
    expect(searchInput).toHaveValue("");
    expect(clearHandler).toBeCalledTimes(1);
});

describe("search api", () => {
    it("should call onReady event and return a SearchApi", async () => {
        let readyEvent: SearchReadyEvent | undefined;
        const readyHandler = (e: SearchReadyEvent) => {
            readyEvent = e;
        };
        const readyMock = vi.fn().mockImplementation(readyHandler);

        await createSearch(undefined, undefined, readyMock);
        await waitForSearch();

        expect(readyMock).toHaveBeenCalledTimes(1);
        expect(readyEvent).toBeDefined();
        expect(readyEvent?.api).toBeDefined();
    });

    it("should call onDisposed event when search is disposed", async () => {
        const disposedHandler = () => {};
        const disposedMock = vi.fn().mockImplementation(disposedHandler);

        const { unmount } = await createSearch(undefined, undefined, undefined, disposedMock);
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

        await createSearch(vi.fn(), clearHandler, readyMock);

        const { searchInput } = await waitForInput();
        const cityName = "Dortmund";
        await inputText(user, searchInput, cityName);
        expect(searchInput).toHaveValue(cityName);

        // reset the input using the SearchApi
        readyEvent?.api.resetInput();

        await waitFor(() => {
            expect(searchInput).toHaveValue("");
        });
        expect(readyMock).toBeCalledTimes(1);
        expect(clearEvent).toBeDefined();
    });

    it("should successfully set input value when setInputValue is called", async () => {
        const selectHandler = vi.fn();
        let readyEvent: SearchReadyEvent | undefined;
        const readyHandler = (e: SearchReadyEvent) => {
            readyEvent = e;
        };

        await createSearch(selectHandler, undefined, readyHandler);
        const { searchInput } = await waitForInput();

        const title = "Dortmund";
        readyEvent?.api.setInputValue(title);

        // input value is set
        await waitFor(() => {
            expect(searchInput).toHaveValue(title);
        });

        // do not trigger any actions
        await expect(waitForMenu(50)).rejects.toThrow("Menu not found");
        expect(selectHandler).not.toHaveBeenCalled();
    });

    it("should successfully replace input value when setInputValue is called", async () => {
        const user = userEvent.setup();

        const selectHandler = vi.fn();

        let readyEvent: SearchReadyEvent | undefined;
        const readyHandler = vi.fn((e: SearchReadyEvent) => {
            readyEvent = e;
        });

        await createSearch(selectHandler, undefined, readyHandler);
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
});

async function createSearch(
    selectHandler?: (event: SearchSelectEvent) => void,
    clearHandler?: (event: SearchClearEvent) => void,
    readyHandler?: (event: SearchReadyEvent) => void,
    disposedHandler?: () => void
) {
    const { map } = await setupMap();

    const sources = [new FakeCitySource(1), new FakeRiverSource(1), new FakeStreetSource(1)];
    const selectHandlerFunction = selectHandler ? selectHandler : (_event: SearchSelectEvent) => {};
    const clearHandlerFunction = clearHandler ? clearHandler : () => {};
    const readyHandlerFunction = readyHandler ? readyHandler : () => {};
    const disposeHandlerFunction = disposedHandler ? disposedHandler : () => {};
    const { unmount } = render(
        <PackageContextProvider>
            <Search
                data-testid="search"
                map={map}
                sources={sources}
                searchTypingDelay={10}
                onSelect={selectHandlerFunction}
                onClear={clearHandlerFunction}
                onReady={readyHandlerFunction}
                onDisposed={disposeHandlerFunction}
            ></Search>
        </PackageContextProvider>
    );

    return { sources, unmount };
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
    return { searchInput };
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

async function waitForClearButton() {
    const searchDiv = await screen.findByTestId<HTMLDivElement>("search");
    const clearButton = await screen.findByLabelText(
        "ariaLabel.clearButton",
        {},
        { container: searchDiv }
    );
    return { clearButton };
}
