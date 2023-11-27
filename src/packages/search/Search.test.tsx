// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { Search, SearchSelectEvent } from "./Search";
import { FakeCitySource, FakeRiverSource, FakeStreetSource } from "./testSources";
import userEvent from "@testing-library/user-event";

beforeEach(() => {
    const errorfn = console.error;
    // HACK to hide act warnings (react select component behaves weird)
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
        if (
            typeof args[0] === "string" &&
            args[0].startsWith("Warning: An update to %s inside a test was not wrapped in act")
        ) {
            return;
        }
        errorfn.call(console, ...args);
    });
});

afterEach(() => {
    vi.restoreAllMocks();
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
    await user.type(searchInput, "Dortmund");

    const { suggestion } = await waitForSuggestion();
    await userEvent.click(suggestion);

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
    expect(clearHandler).toBeCalledTimes(1);
});

async function createSearch(
    selectHandler?: (event: SearchSelectEvent) => void,
    clearHandler?: () => void
) {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    const sources = [new FakeCitySource(1), new FakeRiverSource(1), new FakeStreetSource(1)];
    const selectHandlerFunction = selectHandler ? selectHandler : (_event: SearchSelectEvent) => {};
    const clearHandlerFunction = clearHandler ? clearHandler : () => {};
    render(
        <PackageContextProvider services={injectedServices}>
            <Search
                data-testid="search"
                mapId={mapId}
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
        const { searchDiv } = await waitForSearch();
        const suggestion = searchDiv.getElementsByClassName("search-highlighted-match")[0];

        if (!suggestion) {
            throw new Error("Suggestion not found");
        }
        return { suggestion };
    });
    return { suggestion };
}

async function waitForClearButton() {
    const { clearButton } = await waitFor(async () => {
        const clearButton: Element | null = (
            await screen.findByTestId<HTMLDivElement>("search")
        ).querySelector(".search-clear-container");

        if (!clearButton) {
            throw new Error("Clearbutton not found");
        }
        return { clearButton };
    });
    return { clearButton };
}
