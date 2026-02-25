// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Feature } from "ol";
import { LineString, Polygon, Point } from "ol/geom";
import {
    DrawingSession,
    type DrawingActionHandler
} from "../implementation/hooks/editing/controller/DrawingSession";

describe("DrawingSession", () => {
    let session: DrawingSession;
    let actionHandler: DrawingActionHandler;

    beforeEach(() => {
        session = new DrawingSession();
        actionHandler = {
            undo: vi.fn(),
            redo: vi.fn(),
            finish: vi.fn(),
            reset: vi.fn()
        };
    });

    describe("initial state", () => {
        it("starts with all capabilities disabled", () => {
            expect(session.canFinish).toBe(false);
            expect(session.canReset).toBe(false);
            expect(session.canUndo).toBe(false);
            expect(session.canRedo).toBe(false);
        });
    });

    describe("trackCapabilities", () => {
        it("enables capabilities for LineString with sufficient vertices", async () => {
            const line = new LineString([
                [0, 0],
                [1, 1],
                [2, 2]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);

            expect(session.canFinish).toBe(true);
            expect(session.canReset).toBe(true);
        });

        it("disables finish for LineString with insufficient vertices", () => {
            const line = new LineString([
                [0, 0],
                [1, 1]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);

            expect(session.canFinish).toBe(false);
            expect(session.canReset).toBe(true);
        });

        it("enables capabilities for Polygon with sufficient vertices", () => {
            const polygon = new Polygon([
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0]
                ]
            ]);
            const feature = new Feature(polygon);

            session.trackCapabilities(feature, actionHandler);

            expect(session.canFinish).toBe(true);
            expect(session.canReset).toBe(true);
        });

        it("disables finish for Polygon with insufficient vertices", () => {
            const polygon = new Polygon([
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 0]
                ]
            ]);
            const feature = new Feature(polygon);

            session.trackCapabilities(feature, actionHandler);

            expect(session.canFinish).toBe(false);
            expect(session.canReset).toBe(true);
        });

        it("does not track capabilities for Point geometry", () => {
            const point = new Point([0, 0]);
            const feature = new Feature(point);

            session.trackCapabilities(feature, actionHandler);

            expect(session.canFinish).toBe(false);
            expect(session.canReset).toBe(false);
        });

        it("handles feature without geometry", () => {
            const feature = new Feature();

            expect(() => session.trackCapabilities(feature, actionHandler)).not.toThrow();
            expect(session.canFinish).toBe(false);
            expect(session.canReset).toBe(false);
        });

        it("tracks coordinate changes in undo history", async () => {
            const line = new LineString([
                [0, 0],
                [1, 1]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);
            expect(session.canUndo).toBe(false);

            // Add a new coordinate
            line.appendCoordinate([2, 2]);
            await waitForReactiveUpdate();

            expect(session.canUndo).toBe(true);
        });

        it("updates capabilities when geometry changes", async () => {
            const line = new LineString([
                [0, 0],
                [1, 1]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);
            expect(session.canFinish).toBe(false);

            // Add coordinate to make it finishable
            line.appendCoordinate([2, 2]);
            await waitForReactiveUpdate();

            expect(session.canFinish).toBe(true);
        });

        it("replaces previous tracking when called again", async () => {
            const line1 = new LineString([
                [0, 0],
                [1, 1],
                [2, 2]
            ]);
            const feature1 = new Feature(line1);

            session.trackCapabilities(feature1, actionHandler);
            expect(session.canFinish).toBe(true);

            // Track different feature
            const line2 = new LineString([[0, 0]]);
            const feature2 = new Feature(line2);

            session.trackCapabilities(feature2, actionHandler);

            expect(session.canFinish).toBe(false);
            expect(session.canUndo).toBe(false); // History should be reset
        });
    });

    describe("finish", () => {
        it("calls actionHandler.finish when canFinish is true", () => {
            const line = new LineString([
                [0, 0],
                [1, 1],
                [2, 2]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);
            session.finish();

            expect(actionHandler.finish).toHaveBeenCalledOnce();
        });

        it("does not call actionHandler.finish when canFinish is false", () => {
            const line = new LineString([
                [0, 0],
                [1, 1]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);
            session.finish();

            expect(actionHandler.finish).not.toHaveBeenCalled();
        });

        it("does nothing if not tracking", () => {
            expect(() => session.finish()).not.toThrow();
            expect(actionHandler.finish).not.toHaveBeenCalled();
        });
    });

    describe("reset", () => {
        it("calls actionHandler.reset when canReset is true", () => {
            const line = new LineString([[0, 0]]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);
            session.reset();

            expect(actionHandler.reset).toHaveBeenCalledOnce();
        });

        it("does not call actionHandler.reset when canReset is false", () => {
            const line = new LineString([]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);
            session.reset();

            expect(actionHandler.reset).not.toHaveBeenCalled();
        });

        it("does nothing if not tracking", () => {
            expect(() => session.reset()).not.toThrow();
            expect(actionHandler.reset).not.toHaveBeenCalled();
        });
    });

    describe("undo", () => {
        it("calls actionHandler.undo when canUndo is true", async () => {
            const line = new LineString([
                [0, 0],
                [1, 1]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);

            // Add coordinate to create undo history
            line.appendCoordinate([2, 2]);
            await waitForReactiveUpdate();

            session.undo();

            expect(actionHandler.undo).toHaveBeenCalledOnce();
        });

        it("does not call actionHandler.undo when canUndo is false", () => {
            const line = new LineString([[0, 0]]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);
            session.undo();

            expect(actionHandler.undo).not.toHaveBeenCalled();
        });

        it("does nothing if not tracking", () => {
            expect(() => session.undo()).not.toThrow();
            expect(actionHandler.undo).not.toHaveBeenCalled();
        });

        it("enables redo after undo", async () => {
            const line = new LineString([
                [0, 0],
                [1, 1]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);

            // Add coordinate
            line.appendCoordinate([2, 2]);
            await waitForReactiveUpdate();

            expect(session.canRedo).toBe(false);

            session.undo();
            expect(session.canRedo).toBe(true);
        });
    });

    describe("redo", () => {
        it("calls actionHandler.redo with coordinate when canRedo is true", async () => {
            const line = new LineString([
                [0, 0],
                [1, 1]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);

            // Add coordinate and undo
            line.appendCoordinate([2, 2]);
            await waitForReactiveUpdate();

            session.undo();

            session.redo();

            expect(actionHandler.redo).toHaveBeenCalledWith([2, 2]);
        });

        it("does not call actionHandler.redo when canRedo is false", () => {
            const line = new LineString([[0, 0]]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);
            session.redo();

            expect(actionHandler.redo).not.toHaveBeenCalled();
        });

        it("does nothing if not tracking", () => {
            expect(() => session.redo()).not.toThrow();
            expect(actionHandler.redo).not.toHaveBeenCalled();
        });

        it("disables redo after redo is performed", async () => {
            const line = new LineString([
                [0, 0],
                [1, 1]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);

            line.appendCoordinate([2, 2]);
            await waitForReactiveUpdate();

            session.undo();
            expect(session.canRedo).toBe(true);

            session.redo();
            expect(session.canRedo).toBe(false);
        });
    });

    describe("untrackCapabilities", () => {
        it("resets all capabilities", () => {
            const line = new LineString([
                [0, 0],
                [1, 1],
                [2, 2]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);
            expect(session.canFinish).toBe(true);
            expect(session.canReset).toBe(true);

            session.untrackCapabilities();

            expect(session.canFinish).toBe(false);
            expect(session.canReset).toBe(false);
            expect(session.canUndo).toBe(false);
            expect(session.canRedo).toBe(false);
        });

        it("clears undo history", async () => {
            const line = new LineString([
                [0, 0],
                [1, 1]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);

            line.appendCoordinate([2, 2]);
            await waitForReactiveUpdate();

            expect(session.canUndo).toBe(true);

            session.untrackCapabilities();
            expect(session.canUndo).toBe(false);
        });

        it("can be called multiple times safely", () => {
            session.untrackCapabilities();
            expect(() => session.untrackCapabilities()).not.toThrow();
        });

        it("stops tracking geometry changes", () => {
            const line = new LineString([
                [0, 0],
                [1, 1]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);
            session.untrackCapabilities();

            // Add coordinate - should not affect capabilities
            line.appendCoordinate([2, 2]);
            expect(session.canFinish).toBe(false);
        });
    });

    describe("undo/redo workflow", () => {
        it("handles multiple undo/redo operations", async () => {
            const line = new LineString([
                [0, 0],
                [1, 1]
            ]);
            const feature = new Feature(line);

            session.trackCapabilities(feature, actionHandler);

            // Add two coordinates
            line.appendCoordinate([2, 2]);
            await waitForReactiveUpdate();

            line.appendCoordinate([3, 3]);
            await waitForReactiveUpdate();

            expect(session.canUndo).toBe(true);
            expect(session.canRedo).toBe(false);

            // Undo twice
            session.undo();
            session.undo();

            expect(actionHandler.undo).toHaveBeenCalledTimes(2);
            expect(session.canRedo).toBe(true);

            // Redo once
            session.redo();

            expect(actionHandler.redo).toHaveBeenCalledWith([2, 2]);
            expect(session.canRedo).toBe(true);
        });

        it("clears redo history when new coordinate is added", async () => {
            const line = new LineString([
                [0, 0],
                [1, 1]
            ]);
            const feature = new Feature(line);

            // Create action handler that removes last coordinate on undo
            const testActionHandler: DrawingActionHandler = {
                undo: vi.fn(() => {
                    const coords = line.getCoordinates();
                    if (coords.length > 0) {
                        line.setCoordinates(coords.slice(0, -1));
                    }
                }),
                redo: vi.fn(),
                finish: vi.fn(),
                reset: vi.fn()
            };

            session.trackCapabilities(feature, testActionHandler);

            line.appendCoordinate([2, 2]);
            await waitForReactiveUpdate();

            session.undo();
            await waitForReactiveUpdate();

            expect(session.canRedo).toBe(true);

            // Add new coordinate
            line.appendCoordinate([3, 3]);
            await waitForReactiveUpdate();

            expect(session.canRedo).toBe(false);
        });
    });
});

function waitForReactiveUpdate(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}
