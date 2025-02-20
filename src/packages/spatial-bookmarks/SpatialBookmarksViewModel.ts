// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModel } from "@open-pioneer/map";
import { LocalStorageNamespace, LocalStorageService } from "@open-pioneer/local-storage";
import { v4 as uuid4v } from "uuid";
import { Extent as OlExtent, getCenter } from "ol/extent";
import { transformExtent } from "ol/proj";
import { createLogger } from "@open-pioneer/core";
import { CleanupHandle, reactiveArray, watch } from "@conterra/reactivity-core";

const LOG = createLogger("spatial-bookmark:SpatialBookmarkViewModel");

interface Extent {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export interface Bookmark {
    id: string;
    title: string;
    extent: Extent;
    projection: string;
}

export class SpatialBookmarkViewModel {
    private map: MapModel;
    private packageNamespace: LocalStorageNamespace;
    private writableBookmarks = reactiveArray<Bookmark>([]);
    private watchBookmarksHandle: CleanupHandle;

    /**
     * Provides read-only access to the bookmarks array.
     * The UI simply renders the contents of the store and
     * uses the methods below to modify the state.
     */
    get bookmarks(): Bookmark[] {
        return this.writableBookmarks.getItems();
    }

    constructor(map: MapModel, localStorageService: LocalStorageService) {
        this.map = map;
        this.packageNamespace = localStorageService.getNamespace("spatial-bookmarks");

        // Load from local storage on start; save changes whenever bookmarks change.
        this.loadState();
        this.watchBookmarksHandle = watch(
            () => [this.writableBookmarks.getItems()],
            ([bookmarks]) => this.saveState(bookmarks),
            { immediate: false }
        );
    }

    destroy() {
        this.watchBookmarksHandle.destroy();
    }

    /**
     * Creates a new bookmark with the `title` provided by the UI.
     * The current map extent is used for the new bookmark's extent.
     */
    createBookmark(title: string) {
        // minx, miny, maxx, maxy
        const olExtent = this.map.olView.calculateExtent();
        const projection = this.map.projection.getCode();
        const extent: Extent = {
            minX: olExtent[0]!,
            minY: olExtent[1]!,
            maxX: olExtent[2]!,
            maxY: olExtent[3]!
        };
        const bookmark: Bookmark = {
            id: uuid4v(),
            title,
            extent,
            projection
        };
        LOG.debug("Created a new bookmark", bookmark);

        const bookmarks = this.writableBookmarks;
        bookmarks.push(bookmark);
    }

    /**
     * Activates the bookmark with the given id by zooming
     * to the bookmark's extent.
     */
    activateBookmark(bookmark: Bookmark) {
        LOG.debug("Activating bookmark", bookmark);
        const extent = this.getBookmarkExtent(bookmark);

        LOG.debug("Attempting to apply extent", extent);
        this.applyExtent(extent);
    }

    /**
     * Deletes the bookmark with the given id.
     */
    deleteBookmark(id: string) {
        LOG.debug("Deleting bookmark", id);
        const index = this.writableBookmarks.findIndex((bookmark) => bookmark.id === id);
        if (index > -1) {
            this.writableBookmarks.splice(index, 1);
        }
    }

    /**
     * Deletes all bookmarks.
     */
    deleteAllBookmarks() {
        LOG.debug("Deleting all bookmarks");
        this.writableBookmarks.splice(0);
    }

    /**
     * Loads the bookmarks from local storage.
     * If the bookmarks are not valid, the initial state (empty array) is restored.
     */
    private loadState() {
        LOG.debug("Restoring bookmarks from local storage");

        const rawBookmarks = this.packageNamespace.get("bookmarks") ?? [];
        try {
            validateBookmarks(rawBookmarks);
            this.writableBookmarks.push(...rawBookmarks);
        } catch (e) {
            LOG.error("Bookmarks data in local storage is invalid, resetting to default value.", e);
            this.writableBookmarks.splice(0);
            this.saveState([]);
        }
    }

    /**
     * Saves the bookmarks to local storage.
     */
    private saveState(bookmarks: Bookmark[]) {
        LOG.debug("Saving bookmarks to local storage");
        this.packageNamespace.set("bookmarks", bookmarks);
    }

    /** Computes an OpenLayers extent for the given bookmark. */
    private getBookmarkExtent(bookmark: Bookmark) {
        const olView = this.map.olView;
        const extent = bookmark.extent;
        const olExtent = [extent.minX, extent.minY, extent.maxX, extent.maxY];
        const viewProjection = olView.getProjection();
        const extentProjection = bookmark.projection;
        return transformExtent(olExtent, extentProjection, viewProjection);
    }

    /** Moves the map to the given extent. */
    private applyExtent(olExtent: OlExtent) {
        const olView = this.map.olView;
        const center = getCenter(olExtent);
        const resolution = olView.getResolutionForExtent(olExtent);
        olView.setCenter(center);
        olView.setResolution(resolution);
    }
}

function validateBookmarks(rawBookmarks: unknown): asserts rawBookmarks is Bookmark[] {
    if (!Array.isArray(rawBookmarks)) {
        throw new Error(`Expected bookmarks from local storage to be an array.`);
    }
    for (const rawBookmark of rawBookmarks) {
        validateBookmark(rawBookmark);
    }
}

function validateBookmark(rawBookmark: unknown): asserts rawBookmark is Bookmark {
    if (!rawBookmark || typeof rawBookmark !== "object") {
        throw new Error(`Expected bookmark from local storage to be an object.`);
    }

    const bookmark = rawBookmark as Record<keyof Bookmark, unknown>;
    if (typeof bookmark.id !== "string") {
        throw new Error("Bookmark does not have a valid id.");
    }
    if (typeof bookmark.title !== "string") {
        throw new Error("Bookmark does not have a valid title.");
    }
    validateExtent(bookmark.extent);
    if (typeof bookmark.projection !== "string") {
        throw new Error("Bookmark does not have a valid projection value.");
    }
}

function validateExtent(rawExtent: unknown): asserts rawExtent is Extent {
    if (!rawExtent || typeof rawExtent !== "object") {
        throw new Error(`Expected bookmark extent from local storage to be an object.`);
    }

    const extent = rawExtent as Record<keyof Extent, unknown>;
    if (
        typeof extent.minX !== "number" ||
        typeof extent.minY !== "number" ||
        typeof extent.maxX !== "number" ||
        typeof extent.maxY !== "number"
    ) {
        throw new Error("Expected bookmark extent from local storage to have valid coordinates.");
    }
}
