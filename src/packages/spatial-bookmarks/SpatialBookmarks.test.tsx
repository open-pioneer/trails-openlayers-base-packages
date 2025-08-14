// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LocalStorageNamespace, LocalStorageService } from "@open-pioneer/local-storage";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import {
    act,
    findByLabelText,
    findByPlaceholderText,
    findByRole,
    findByText,
    render,
    screen
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { SpatialBookmarks, SpatialBookmarksProps } from "./SpatialBookmarks";
import { Bookmark } from "./SpatialBookmarksViewModel";

const MOCK_NAMESPACE_CONTENT = new Map<string, unknown>();

const MOCK_NAMESPACE = {
    get(key) {
        return MOCK_NAMESPACE_CONTENT.get(key);
    },
    set(key, value) {
        MOCK_NAMESPACE_CONTENT.set(key, value);
    }
} satisfies Partial<LocalStorageNamespace>;

const MOCK_STORAGE_SERVICE: Partial<LocalStorageService> = {
    getNamespace(key): LocalStorageNamespace {
        if (key !== "spatial-bookmarks") {
            throw new Error("unexpected key");
        }

        return MOCK_NAMESPACE as LocalStorageNamespace;
    }
};

afterEach(() => {
    MOCK_NAMESPACE_CONTENT.clear();
});

it("should shown an alert message if no bookmarks are saved", async () => {
    MOCK_NAMESPACE.set("bookmarks", []);

    const { div } = await createBookmarkComponent();
    const alertDiv = await findByRole(div, "alert");
    expect(alertDiv).toMatchSnapshot();
});

it("should load the stored bookmark from local storage and present it visibly within the list", async () => {
    createBookmarks();
    const { div } = await createBookmarkComponent();
    const bookmarkList = await findByRole(div, "listbox");
    expect(bookmarkList).toMatchSnapshot();
});

it("should save a bookmark and update the list", async () => {
    const user = userEvent.setup();
    MOCK_NAMESPACE.set("bookmarks", []);

    const { div } = await createBookmarkComponent();

    const createBtn = await findByText(div, "bookmark.button.create");

    await user.click(createBtn);
    const input = await findByPlaceholderText(div, "bookmark.input.placeholder");
    const saveBtn = await findByText(div, "bookmark.button.save");

    await user.type(input, "Dortmund");
    await user.click(saveBtn);
    const bookmarks = MOCK_NAMESPACE.get("bookmarks") as Bookmark[];

    expect(bookmarks[0]?.title).toEqual("Dortmund");
});

it("should only delete all bookmarks after the user confirms the action.", async () => {
    const user = userEvent.setup();

    createBookmarks();
    const { div } = await createBookmarkComponent();

    const deleteAllBtn = await findByLabelText(div, "bookmark.button.deleteAll");
    await user.click(deleteAllBtn);
    const alertMessage = await findByRole(div, "alert");
    expect(alertMessage).toMatchSnapshot();

    const confirmBtn = await findByText(div, "bookmark.button.confirmDelete");
    await user.click(confirmBtn);
    const noSavedBookmarksAlert = await findByText(div, "bookmark.alert.noSaved");
    expect(noSavedBookmarksAlert).toMatchSnapshot();

    const bookmarks = MOCK_NAMESPACE.get("bookmarks") as Bookmark[];
    expect(bookmarks).toHaveLength(0);
});

it("should remove bookmark from the list by clicking the remove button", async () => {
    const user = userEvent.setup();

    createBookmarks();
    const { div } = await createBookmarkComponent();

    const deleteBookmarkBtn = await findByLabelText(div, "bookmark.button.deleteOne.ariaLabel");
    await user.click(deleteBookmarkBtn);
    const noSavedBookmarksAlert = await findByText(div, "bookmark.alert.noSaved");
    expect(noSavedBookmarksAlert).toMatchSnapshot();

    const bookmarks = MOCK_NAMESPACE.get("bookmarks") as Bookmark[];
    expect(bookmarks).toHaveLength(0);
});

it("should center the map on the selected bookmark", async () => {
    const user = userEvent.setup();
    const bookmarks = createBookmarks();
    const { mapModel, div } = await createBookmarkComponent();

    const extent = bookmarks[0]!.extent;
    const bookmarkExtent = [extent.minX, extent.minY, extent.maxX, extent.maxY];

    const initExtent = mapModel.olMap.getView().calculateExtent();
    expect(initExtent).not.toStrictEqual(bookmarkExtent);

    const bookmarkItem = await findByText(div, "Test");
    await user.click(bookmarkItem);
    const newExtent = mapModel.olMap.getView().calculateExtent();
    expect(newExtent).toStrictEqual(bookmarkExtent);
});

it("should move the focus up and down inside the bookmarks list", async () => {
    const user = userEvent.setup();
    createBookmarks(2);
    const { div } = await createBookmarkComponent();

    const listItems = div.querySelectorAll("li");
    expect(listItems).toHaveLength(2);

    const firstItem = listItems[0]!;
    const secondItem = listItems[1]!;

    // Init focus to first item
    act(() => firstItem.focus());
    expect(document.activeElement).toBe(firstItem);

    // Downarrow focuses second item
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(secondItem);

    // Wraps to first item
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(firstItem);

    // Up wraps back to second item
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(secondItem);

    // ... and up to first
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(firstItem);
});

interface CtxProviderConfig {
    "local-storage.LocalStorageService": Partial<LocalStorageService>;
}

async function createBookmarkComponent() {
    const { mapModel, injectedServices } = await setupComponent();
    renderComponent({ services: injectedServices }, { map: mapModel, "data-testid": "bookmarks" });
    const div = await waitForSpatialBookmarks();
    return { mapModel, div };
}

async function setupComponent() {
    const { map, registry } = await setupMap({
        projection: "EPSG:25832"
    });
    const injectedServices = {
        ...createServiceOptions({ registry }),
        "local-storage.LocalStorageService": MOCK_STORAGE_SERVICE
    };
    return {
        mapModel: map,
        injectedServices
    };
}
function renderComponent(
    contextProviderProps: { services: CtxProviderConfig },
    componentProps: SpatialBookmarksProps
) {
    return render(
        <PackageContextProvider {...contextProviderProps}>
            <SpatialBookmarks {...componentProps} />
        </PackageContextProvider>
    );
}
async function waitForSpatialBookmarks() {
    return await screen.findByTestId<HTMLDivElement>("bookmarks");
}

function createBookmarks(count = 1) {
    const bookmarks: Bookmark[] = [];
    for (let i = 0; i < count; ++i) {
        const bookmark: Bookmark = {
            id: `test-${i}`,
            title: "Test",
            extent: {
                minX: 404609.0492711461,
                minY: 5759938.978042119,
                maxX: 405066.2854485374,
                maxY: 5760396.21421951
            },
            projection: "EPSG:25832"
        };
        bookmarks.push(bookmark);
    }

    MOCK_NAMESPACE.set("bookmarks", bookmarks);
    return bookmarks;
}
