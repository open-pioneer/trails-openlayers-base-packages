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
    expect(alertDiv).toMatchInlineSnapshot(`
      <div
        class="chakra-alert css-b9ls1z"
        data-status="info"
        data-theme="light"
        role="alert"
      >
        <span
          class="chakra-alert__icon css-14ogjxt"
          data-status="info"
          data-theme="light"
        >
          <svg
            class="chakra-icon css-qk6lof"
            data-theme="light"
            focusable="false"
            viewBox="0 0 24 24"
          >
            <path
              d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm.25,5a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,12.25,5ZM14.5,18.5h-4a1,1,0,0,1,0-2h.75a.25.25,0,0,0,.25-.25v-4.5a.25.25,0,0,0-.25-.25H10.5a1,1,0,0,1,0-2h1a2,2,0,0,1,2,2v4.75a.25.25,0,0,0,.25.25h.75a1,1,0,1,1,0,2Z"
              fill="currentColor"
            />
          </svg>
        </span>
        bookmark.alert.noSaved
      </div>
    `);
});
it("should load the stored bookmark from localstorage and present it visibly within the list", async () => {
    createBookmark();
    createBookmarkComponent();
    const div = await waitForSpatialBookmark();
    const bookmarkList = await findByRole(div, "listbox");
    expect(bookmarkList).toMatchInlineSnapshot(`
      <ul
        aria-label="bookmark.list.label"
        class="spatial-bookmark-list css-y3cje8"
        data-theme="light"
        role="listbox"
      >
        <li
          class="spatial-bookmark-item spatial-bookmark-item-test css-ol9amj"
          data-theme="light"
          role="option"
        >
          <div
            class="css-1h36yqy"
            data-theme="light"
          >
            <svg
              fill="currentColor"
              height="1em"
              stroke="currentColor"
              stroke-width="0"
              viewBox="0 0 256 256"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M228.92,49.69a8,8,0,0,0-6.86-1.45L160.93,63.52,99.58,32.84a8,8,0,0,0-5.52-.6l-64,16A8,8,0,0,0,24,56V200a8,8,0,0,0,9.94,7.76l61.13-15.28,61.35,30.68A8.15,8.15,0,0,0,160,224a8,8,0,0,0,1.94-.24l64-16A8,8,0,0,0,232,200V56A8,8,0,0,0,228.92,49.69ZM104,52.94l48,24V203.06l-48-24ZM40,62.25l48-12v127.5l-48,12Zm176,131.5-48,12V78.25l48-12Z"
              />
            </svg>
            <p
              class="chakra-text css-zvlevn"
              data-theme="light"
            >
              Test
            </p>
            <div
              class="css-17xejub"
              data-theme="light"
            />
            <button
              aria-label="bookmark.button.deleteOne"
              class="chakra-button spatial-bookmark-item-details css-hzhyv0"
              data-theme="light"
              type="button"
            >
              <span
                class="chakra-button__icon css-1dwr89y"
                data-theme="light"
              >
                <svg
                  aria-hidden="true"
                  fill="currentColor"
                  focusable="false"
                  height="1em"
                  stroke="currentColor"
                  stroke-width="0"
                  viewBox="0 0 256 256"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M216,50H40a6,6,0,0,0,0,12H50V208a14,14,0,0,0,14,14H192a14,14,0,0,0,14-14V62h10a6,6,0,0,0,0-12ZM194,208a2,2,0,0,1-2,2H64a2,2,0,0,1-2-2V62H194ZM82,24a6,6,0,0,1,6-6h80a6,6,0,0,1,0,12H88A6,6,0,0,1,82,24Z"
                  />
                </svg>
              </span>
            </button>
          </div>
        </li>
      </ul>
    `);
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
    expect(alertMessage).toMatchInlineSnapshot(`
      <div
        class="chakra-alert css-ercdzk"
        data-status="warning"
        data-theme="light"
        role="alert"
      >
        <span
          class="chakra-alert__icon css-14ogjxt"
          data-status="warning"
          data-theme="light"
        >
          <svg
            class="chakra-icon css-qk6lof"
            data-theme="light"
            focusable="false"
            viewBox="0 0 24 24"
          >
            <path
              d="M11.983,0a12.206,12.206,0,0,0-8.51,3.653A11.8,11.8,0,0,0,0,12.207,11.779,11.779,0,0,0,11.8,24h.214A12.111,12.111,0,0,0,24,11.791h0A11.766,11.766,0,0,0,11.983,0ZM10.5,16.542a1.476,1.476,0,0,1,1.449-1.53h.027a1.527,1.527,0,0,1,1.523,1.47,1.475,1.475,0,0,1-1.449,1.53h-.027A1.529,1.529,0,0,1,10.5,16.542ZM11,12.5v-6a1,1,0,0,1,2,0v6a1,1,0,1,1-2,0Z"
              fill="currentColor"
            />
          </svg>
        </span>
        bookmark.alert.delete
      </div>
    `);
    const confirmBtn = await findByText(div, "bookmark.button.confirmDelete");
    await user.click(confirmBtn);
    const noSavedBookmarksAlert = await findByText(div, "bookmark.alert.noSaved");
    expect(noSavedBookmarksAlert).toMatchInlineSnapshot(`
      <div
        class="chakra-alert css-b9ls1z"
        data-status="info"
        data-theme="light"
        role="alert"
      >
        <span
          class="chakra-alert__icon css-14ogjxt"
          data-status="info"
          data-theme="light"
        >
          <svg
            class="chakra-icon css-qk6lof"
            data-theme="light"
            focusable="false"
            viewBox="0 0 24 24"
          >
            <path
              d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm.25,5a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,12.25,5ZM14.5,18.5h-4a1,1,0,0,1,0-2h.75a.25.25,0,0,0,.25-.25v-4.5a.25.25,0,0,0-.25-.25H10.5a1,1,0,0,1,0-2h1a2,2,0,0,1,2,2v4.75a.25.25,0,0,0,.25.25h.75a1,1,0,1,1,0,2Z"
              fill="currentColor"
            />
          </svg>
        </span>
        bookmark.alert.noSaved
      </div>
    `);
});

it("should remove bookmark from the list by clicking the remove button", async () => {
    createBookmark();
    const user = userEvent.setup();
    createBookmarkComponent();
    const div = await waitForSpatialBookmark();
    const deleteBookmarkBtn = await findByLabelText(div, "bookmark.button.deleteOne");
    await user.click(deleteBookmarkBtn);
    const noSavedBookmarksAlert = await findByText(div, "bookmark.alert.noSaved");
    expect(noSavedBookmarksAlert).toMatchInlineSnapshot(`
      <div
        class="chakra-alert css-b9ls1z"
        data-status="info"
        data-theme="light"
        role="alert"
      >
        <span
          class="chakra-alert__icon css-14ogjxt"
          data-status="info"
          data-theme="light"
        >
          <svg
            class="chakra-icon css-qk6lof"
            data-theme="light"
            focusable="false"
            viewBox="0 0 24 24"
          >
            <path
              d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm.25,5a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,12.25,5ZM14.5,18.5h-4a1,1,0,0,1,0-2h.75a.25.25,0,0,0,.25-.25v-4.5a.25.25,0,0,0-.25-.25H10.5a1,1,0,0,1,0-2h1a2,2,0,0,1,2,2v4.75a.25.25,0,0,0,.25.25h.75a1,1,0,1,1,0,2Z"
              fill="currentColor"
            />
          </svg>
        </span>
        bookmark.alert.noSaved
      </div>
    `);
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
