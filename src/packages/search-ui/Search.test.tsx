// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { Search, SelectSearchEvent } from "./Search";
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

it("should successfully create a measurement component", async () => {
    await createSearch();
    // search is mounted
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

    const selectHandler = vi.fn();

    await createSearch(selectHandler);

    // search is mounted
    const { searchInput } = await waitForInput();
    await user.type(searchInput, "Dortmund");
    const { suggestion } = await waitForSuggestion();
    expect(suggestion).toHaveTextContent("Dortmund");
});

it("should successfully call select handler after clicking a suggestion", async () => {
    const user = userEvent.setup();

    const selectHandler = vi.fn();

    await createSearch(selectHandler);
    // search is mounted
    const { searchInput } = await waitForInput();
    await user.type(searchInput, "Dortmund");

    const { suggestion } = await waitForSuggestion();
    await userEvent.click(suggestion);

    expect(selectHandler).toHaveBeenCalledWith({
        "action": "select-option",
        "suggestion": {
            "label": "Dortmund",
            "value": "Dortmund"
        }
    });
});

it("should successfully clear a suggestion select", async () => {
    const user = userEvent.setup();

    const selectHandler = vi.fn();
    const clearHandler = vi.fn();

    await createSearch(selectHandler, clearHandler);
    // search is mounted
    const { searchInput } = await waitForInput();
    await user.type(searchInput, "Dortmund");

    const { suggestion } = await waitForSuggestion();
    await userEvent.click(suggestion);
    const { clearButton } = await waitForClearButton();
    await userEvent.click(clearButton);
    //Todo Test not Work
    expect(clearHandler).toBeCalledTimes(1);
});

async function createSearch(
    selectHandler?: (event: SelectSearchEvent) => void,
    clearHandler?: () => void
) {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    const sources = [new FakeCitySource(), new FakeRiverSource(), new FakeStreetSource()];
    const selectHandlerFunction = selectHandler ? selectHandler : (_event: SelectSearchEvent) => {};
    const clearHandlerFunction = clearHandler ? clearHandler : () => {};
    render(
        <PackageContextProvider services={injectedServices}>
            <Search
                data-testid="search"
                mapId={mapId}
                sources={sources}
                onSelect={selectHandlerFunction}
                onClear={clearHandlerFunction}
            ></Search>
        </PackageContextProvider>
    );
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
        ).querySelector('[role = "button"]');

        if (!clearButton) {
            throw new Error("Clearbutton not found");
        }
        return { clearButton };
    });
    return { clearButton };
}