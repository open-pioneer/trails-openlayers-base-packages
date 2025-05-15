// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, expect, it, vi } from "vitest";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { Search, SearchSelectEvent } from "./Search";
import { FakeCitySource, FakeRiverSource, FakeStreetSource } from "./testSources";
import userEvent from "@testing-library/user-event";
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
    await user.type(searchInput, "Dortmund");
    expect(searchInput).toHaveValue("Dortmund");
});

it("should successfully show a search suggestion", async () => {
    const user = userEvent.setup();
    await createSearch();

    const { searchInput } = await waitForInput();
    await user.type(searchInput, "Dortmund");
    const { suggestion } = await waitForSuggestion();
    expect(suggestion).toHaveTextContent("Dortmund");
});

it("should successfully call select handler after clicking a suggestion", async () => {
    const user = userEvent.setup();

    const selectHandler = vi.fn();
    const { sources } = await createSearch(selectHandler);
    const citySource = sources[0]!;

    const { searchInput } = await waitForInput();
    await user.type(searchInput, "Dort");

    const { suggestion } = await waitForSuggestion();
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
    await user.type(searchInput, "Dortmund");

    const { suggestion } = await waitForSuggestion();
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
    await user.type(searchInput, "Dortmund");
    expect(searchInput).toHaveValue("Dortmund");

    const { clearButton } = await waitForClearButton();
    await userEvent.click(clearButton);
    expect(searchInput).toHaveValue("");
    expect(clearHandler).toBeCalledTimes(1);
});

async function createSearch(
    selectHandler?: (event: SearchSelectEvent) => void,
    clearHandler?: () => void
) {
    const { map, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const sources = [new FakeCitySource(1), new FakeRiverSource(1), new FakeStreetSource(1)];
    const selectHandlerFunction = selectHandler ? selectHandler : (_event: SearchSelectEvent) => {};
    const clearHandlerFunction = clearHandler ? clearHandler : () => {};
    render(
        <PackageContextProvider services={injectedServices}>
            <Search
                data-testid="search"
                map={map}
                sources={sources}
                searchTypingDelay={10}
                onSelect={selectHandlerFunction}
                onClear={clearHandlerFunction}
            ></Search>
        </PackageContextProvider>
    );

    return { sources };
}

async function waitForSearch() {
    const searchDiv = await screen.findByTestId<HTMLDivElement>("search");
    return { searchDiv };
}

async function waitForMenu() {
    const menuDiv = await waitFor(() => {
        const menuDiv = document.body.querySelector(".search-component-menu");
        if (!menuDiv) {
            throw new Error("Menu not found");
        }
        return menuDiv as HTMLElement;
    });
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

async function waitForSuggestion() {
    const { suggestion } = await waitFor(async () => {
        const { menuDiv } = await waitForMenu();
        const suggestion = menuDiv.getElementsByClassName("search-highlighted-match")[0];

        if (!suggestion) {
            throw new Error("Suggestion not found");
        }
        return { suggestion };
    });
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
