// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { FrameState } from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import type ExecutorGroup from "ol/render/canvas/ExecutorGroup";
import CanvasVectorLayerRenderer from "ol/renderer/canvas/VectorLayer";
import ViewHint from "ol/ViewHint";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SubpixelCanvasVectorLayerRenderer, SubpixelVectorLayer } from "./subpixelVectorLayer";

/**
 * Guard gegen OpenLayers-Upgrades: `SubpixelVectorLayer` koppelt an interne Renderpfad-Details
 * (`CanvasVectorLayerRenderer.renderWorlds`, `frameState.viewHints`, `ViewHint.ANIMATING`). Ändern
 * sich diese Annahmen in einer neuen OpenLayers-Version, schlagen die folgenden Tests früh und
 * eindeutig an.
 */
describe("SubpixelVectorLayer – OpenLayers-Seam-Guard", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("ViewHint-Semantik unverändert (ANIMATING=0, INTERACTING=1)", () => {
        expect(ViewHint.ANIMATING).toBe(0);
        expect(ViewHint.INTERACTING).toBe(1);
    });

    it("renderWorlds existiert weiterhin im OpenLayers-Canvas-Vektor-Renderer", () => {
        expect(typeof CanvasVectorLayerRenderer.prototype.renderWorlds).toBe("function");
    });

    it("SubpixelVectorLayer überschreibt createRenderer gegenüber VectorLayer", () => {
        // createRenderer ist `protected`; für den Referenzvergleich bewusst über einen Cast lesen.
        const subpixelCreateRenderer = (
            SubpixelVectorLayer.prototype as unknown as { createRenderer: unknown }
        ).createRenderer;
        const baseCreateRenderer = (VectorLayer.prototype as unknown as { createRenderer: unknown })
            .createRenderer;
        expect(subpixelCreateRenderer).not.toBe(baseCreateRenderer);
    });

    it("erzwingt snapToPixel=false nur während des Super-Aufrufs und stellt viewHints wieder her", () => {
        let animatingDuringSuper: number | undefined;
        const spy = vi
            .spyOn(CanvasVectorLayerRenderer.prototype, "renderWorlds")
            .mockImplementation((_executorGroup, frameState) => {
                animatingDuringSuper = frameState.viewHints[ViewHint.ANIMATING];
            });

        const renderer = Object.create(
            SubpixelCanvasVectorLayerRenderer.prototype
        ) as SubpixelCanvasVectorLayerRenderer;
        const frameState = { viewHints: [0, 0] } as unknown as FrameState;

        renderer.renderWorlds({} as unknown as ExecutorGroup, frameState);

        expect(spy).toHaveBeenCalledTimes(1);
        // Während des Renderns dieses Layers ist ANIMATING gesetzt -> snapToPixel=false (subpixel).
        expect(animatingDuringSuper).toBe(1);
        // Danach ist der ursprüngliche Wert wiederhergestellt -> andere Layer bleiben unbeeinflusst.
        expect(frameState.viewHints[ViewHint.ANIMATING]).toBe(0);
    });
});
