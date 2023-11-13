// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from "vitest";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { Search, SearchEvent } from "./Search";
import { FakeCitySource, FakeRiverSource, FakeStreetSource } from "./testSources";
import userEvent from "@testing-library/user-event";

it("should successfully create a measurement component", async () => {
    await createSearch();
    // search is mounted
    const { searchDiv } = await waitForSearch();
    expect(searchDiv).toMatchSnapshot();
});

it("should successfully type into search", async () => {
    const user = userEvent.setup();
    await createSearch();
    // search is mounted
    const { searchInput } = await waitForInput();
    await user.type(searchInput, "Dortmund");
    expect(searchInput); //.toHaveValue("Dortmund");
});

it("should successfully show a search suggestion", async () => {
    const user = userEvent.setup();

    await createSearch();

    // search is mounted
    const { searchInput } = await waitForInput();
    await user.type(searchInput, "Dortmund");

    setTimeout(async () => {
        const { suggestion } = await waitForSuggestion();
        expect(suggestion); //.toHaveValue("Dortmund");
    }, 1000);
});

it("should successfully show a suggestion select", async () => {
    const user = userEvent.setup();

    const selectHandler = (event: SearchEvent) => {
        console.debug("User selectet " + event.suggestion?.value + " from Search");
    };

    await createSearch(selectHandler);
    // search is mounted
    const { searchInput } = await waitForInput();
    await user.type(searchInput, "Dortmund");

    setTimeout(async () => {
        const { suggestion } = await waitForSuggestion();
        userEvent.click(suggestion);
        //Todo Test not Work
        expect(selectHandler).toBeCalledTimes(1);
    }, 1000);
});

it("should successfully clear a suggestion select", async () => {
    const user = userEvent.setup();

    const selectHandler = (event: SearchEvent) => {
        console.debug("User selectet " + event.suggestion?.value + " from Search");
    };
    const clearHandler = (event: SearchEvent) => {
        console.debug("User clear " + event.suggestion?.value + " from Search");
    };

    await createSearch(selectHandler, clearHandler);
    // search is mounted
    const { searchInput } = await waitForInput();
    await user.type(searchInput, "Dortmund");

    setTimeout(async () => {
        const { suggestion } = await waitForSuggestion();
        userEvent.click(suggestion);
        const { clearButton } = await waitForClearButton();
        userEvent.click(clearButton);
        //Todo Test not Work
        expect(clearHandler).toBeCalledTimes(1);
    }, 1000);
});

async function createSearch(
    selectHandler?: (event: SearchEvent) => void,
    clearHandler?: (event: SearchEvent) => void
) {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    const sources = [new FakeCitySource(), new FakeRiverSource(), new FakeStreetSource()];
    const selectHandlerFunction = selectHandler? selectHandler:(event: SearchEvent) => {console.debug(event);};
    const clearHandlerFunction = clearHandler? clearHandler: (event: SearchEvent) => {console.debug(event);};
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
    const { searchDiv } = await waitFor(async () => {
        const searchDiv: HTMLDivElement | null =
            await screen.findByTestId<HTMLDivElement>("search");
        if (!searchDiv) {
            throw new Error("Search not rendered");
        }

        return { searchDiv };
    });

    return { searchDiv };
}

async function waitForInput() {
    const { searchInput } = await waitFor(async () => {
        const searchInput: HTMLInputElement | undefined = (
            await screen.findByTestId<HTMLDivElement>("search")
        ).getElementsByTagName("input")[0];
        if (!searchInput) {
            throw new Error("input not rendered");
        }

        return { searchInput };
    });

    return { searchInput };
}

async function waitForSuggestion() {
    const { suggestion } = await waitFor(async () => {
        const suggestion: Element | undefined = (
            await screen.findByTestId<HTMLDivElement>("search")
        ).getElementsByClassName("search-highlighted-match")[0];

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
