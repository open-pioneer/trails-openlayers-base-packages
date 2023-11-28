// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, it } from "vitest";

import {
    render,
    screen,
    findByRole,
    findByPlaceholderText,
    findByText,
    findByLabelText
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { LocalStorageService, LocalStorageNamespace } from "@open-pioneer/local-storage";
import { SpatialBookmark } from "./SpatialBookmark";
import { Bookmark } from "./SpatialBookmarkViewModel";

/*
    TODO: 
    - replace toMatchInlineSnapshot with toMatchSnapshot ?!
*/

const MOCK_NAMESPACE = new Map<string, unknown>();
afterEach(() => {
    MOCK_NAMESPACE.clear();
});
const localStorageService: Partial<LocalStorageService> = {
    getNamespace(key): LocalStorageNamespace {
        if (key !== "spatial-bookmarks") {
            throw new Error("unexpected key");
        }
        return {
            get(key) {
                return MOCK_NAMESPACE.get(key);
            },
            set(key, value) {
                MOCK_NAMESPACE.set(key, value);
            }
        } as LocalStorageNamespace;
    }
};
const packageNamespace = localStorageService.getNamespace!("spatial-bookmarks");

it("except if currently no bookmarks are saved to display info message", async () => {
    packageNamespace.set("bookmarks", []);
    createBookmarkComponent();
    const div = await waitForSpatialBookmark();
    const alertDiv = await findByRole(div, "alert");
    expect(alertDiv).toMatchInlineSnapshot();
});
it("should load the stored bookmark from localstorage and present it visibly within the list", async () => {
    createBookmark();
    createBookmarkComponent();
    const div = await waitForSpatialBookmark();
    const bookmarkList = await findByRole(div, "listbox");
    expect(bookmarkList).toMatchInlineSnapshot();
});

it("should save a bookmark and update the list", async () => {
    const user = userEvent.setup();
    packageNamespace.set("bookmarks", []);
    createBookmarkComponent();
    const div = await waitForSpatialBookmark();
    const createBtn = await findByText(div, "bookmark.button.create");

    //click the button to create a bookmark
    await user.click(createBtn);
    const input = await findByPlaceholderText(div, "bookmark.input.placeholder");
    const saveBtn = await findByText(div, "bookmark.button.save");
    //set bookmark name in the input
    await user.type(input, "Dortmund");
    await user.click(saveBtn);
    const bookmark = packageNamespace.get("bookmarks") as Bookmark[];
    //TODO: snapshot differs due to the slug method in listItem css class
    expect(bookmark[0]?.title).toEqual("Dortmund");
});

it("should only delete all bookmarks after the user confirms the action.", async () => {
    createBookmark();
    const user = userEvent.setup();
    createBookmarkComponent();
    const div = await waitForSpatialBookmark();
    const deleteAllBtn = await findByLabelText(div, "bookmark.button.deleteAll");
    await user.click(deleteAllBtn);
    const alertMessage = await findByRole(div, "alert");
    expect(alertMessage).toMatchInlineSnapshot();
    const confirmBtn = await findByText(div, "bookmark.button.confirmDelete");
    await user.click(confirmBtn);
    const noSavedBookmarksAlert = await findByText(div, "bookmark.alert.noSaved");
    expect(noSavedBookmarksAlert).toMatchInlineSnapshot();
});

it("should remove bookmark from the list by clicking the remove button", async () => {
    createBookmark();
    const user = userEvent.setup();
    createBookmarkComponent();
    const div = await waitForSpatialBookmark();
    const deleteBookmarkBtn = await findByLabelText(div, "bookmark.button.deleteOne");
    await user.click(deleteBookmarkBtn);
    const noSavedBookmarksAlert = await findByText(div, "bookmark.alert.noSaved");
    expect(noSavedBookmarksAlert).toMatchInlineSnapshot();
});

it("should center the map on the selected bookmark", async () => {
    const bookmark = createBookmark();
    const user = userEvent.setup();
    const { mapId, injectedServices, mapModel } = await setupComponent();
    renderComponent({ services: injectedServices }, { mapId: mapId, "data-testid": "bookmarks" });
    const extent = bookmark.extent;
    const bookmarkExtent = [extent.minX, extent.minY, extent.maxX, extent.maxY];
    const initExtent = mapModel.olMap.getView().calculateExtent();
    expect(initExtent).not.toStrictEqual(bookmarkExtent);
    const div = await waitForSpatialBookmark();
    const bookmarkItem = await findByText(div, "Test");
    await user.click(bookmarkItem);
    const newExtent = mapModel.olMap.getView().calculateExtent();
    expect(newExtent).toStrictEqual(bookmarkExtent);
});

interface ctxProviderConfig {
    "local-storage.LocalStorageService": Partial<LocalStorageService>;
}
interface componentPropsConfig {
    mapId: string;
    "data-testid": string;
}
async function createBookmarkComponent() {
    const { mapId, injectedServices } = await setupComponent();
    renderComponent({ services: injectedServices }, { mapId: mapId, "data-testid": "bookmarks" });
}
async function setupComponent() {
    const { mapId, registry } = await setupMap({
        projection: "EPSG:25832"
    });
    const mapModel = await registry.expectMapModel(mapId);
    const injectedServices = {
        ...createServiceOptions({ registry }),
        "local-storage.LocalStorageService": localStorageService
    };
    return {
        mapModel,
        mapId,
        injectedServices
    };
}
function renderComponent(
    contextProviderProps: { services: ctxProviderConfig },
    componentProps: componentPropsConfig
) {
    return render(
        <PackageContextProvider {...contextProviderProps}>
            <SpatialBookmark {...componentProps} />
        </PackageContextProvider>
    );
}
async function waitForSpatialBookmark() {
    return await screen.findByTestId<HTMLDivElement>("bookmarks");
}

function createBookmark() {
    const bookmark: Bookmark = {
        id: "test",
        title: "Test",
        extent: {
            minX: 404609.0492711461,
            minY: 5759938.978042119,
            maxX: 405066.2854485374,
            maxY: 5760396.21421951
        },
        projection: "EPSG:25832"
    };
    packageNamespace.set("bookmarks", [bookmark]);
    return bookmark;
}
