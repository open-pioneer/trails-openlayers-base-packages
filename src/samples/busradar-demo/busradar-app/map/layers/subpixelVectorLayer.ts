// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import VectorLayer from "ol/layer/Vector";
import type { FrameState } from "ol/Map";
import type ExecutorGroup from "ol/render/canvas/ExecutorGroup";
import CanvasVectorLayerRenderer from "ol/renderer/canvas/VectorLayer";
import type VectorSource from "ol/source/Vector";
import ViewHint from "ol/ViewHint";

/**
 * Renderer-Variante, die OpenLayers' Ganzpixel-Rundung (`snapToPixel`) **nur für diesen Layer**
 * unterdrückt, damit sich bewegende Features (Live-Busse) subpixelgenau und flüssig statt
 * pixelweise gerendert werden.
 *
 * Hintergrund (verifiziert gegen **OpenLayers 10.9.0**):
 * - Der Canvas-Vektor-Renderer leitet `snapToPixel` in `CanvasVectorLayerRenderer.renderWorlds`
 *   allein aus `frameState.viewHints` ab:
 *   `renderer/canvas/VectorLayer.js` →
 *   `const snapToPixel = !(viewHints[ViewHint.ANIMATING] || viewHints[ViewHint.INTERACTING])`.
 * - Ist `snapToPixel` aktiv (also bei **statischer** Karte – kein Pan/Zoom/Interaktion), rundet der
 *   Executor die Icon-Zeichenposition auf ganze Geräte-Pixel:
 *   `render/canvas/Executor.js` → `if (snapToPixel) { x = Math.round(x); y = Math.round(y); }`.
 * - Ein Bus bewegt sich pro Frame nur um Bruchteile eines Pixels (beim Herauszoomen noch weniger).
 *   Die gerundete Position bleibt daher mehrere Frames stehen und springt dann um 1 px – sichtbares
 *   Ruckeln, unabhängig von der Framerate.
 *
 * Lösung: Wir setzen `viewHints[ViewHint.ANIMATING]` **ausschließlich für die Dauer des
 * Super-Aufrufs** transient auf `1` (→ `snapToPixel = false`) und stellen den ursprünglichen Wert
 * unmittelbar danach wieder her. OpenLayers rendert Layer sequenziell, daher wirkt dies nur auf
 * diesen einen Layer: andere Layer, die Kartenansicht, die Interaktion, die Render-Frequenz und die
 * Idle-Logik der Karte bleiben unberührt (kein globaler ANIMATING-Zustand, keine zusätzlichen
 * Renders). Feature-Koordinaten, Interpolation, Rotation, Labels und Zoom-Skalierung ändern sich
 * nicht – die Wirkung ist auf das Rendering genau dieses Layers begrenzt.
 *
 * ACHTUNG – Kopplung an OpenLayers-Interna: `renderWorlds`, `frameState.viewHints` und
 * `ViewHint.ANIMATING` sind interne Renderpfad-Details. Ein OpenLayers-Upgrade kann diesen Seam
 * ändern. `subpixelVectorLayer.test.ts` prüft die hier vorausgesetzten Annahmen und schlägt bei
 * einem inkompatiblen Upgrade früh und sichtbar an. Bei Ausfall des Seams degradiert das Verhalten
 * gutartig (die Busse würden wieder wie zuvor snappen, kein Absturz).
 */
export class SubpixelCanvasVectorLayerRenderer extends CanvasVectorLayerRenderer {
    override renderWorlds(
        executorGroup: ExecutorGroup,
        frameState: FrameState,
        declutterable?: boolean
    ): void {
        const viewHints = frameState.viewHints;
        const previousAnimating = viewHints[ViewHint.ANIMATING] ?? 0;
        viewHints[ViewHint.ANIMATING] = 1;
        try {
            super.renderWorlds(executorGroup, frameState, declutterable);
        } finally {
            viewHints[ViewHint.ANIMATING] = previousAnimating;
        }
    }
}

/**
 * `VectorLayer`, das seine Features subpixelgenau rendert (ohne OpenLayers-Ganzpixel-Snapping bei
 * statischer View). Nur für Layer mit kontinuierlich bewegten Features gedacht (z. B. Live-Busse).
 */
export class SubpixelVectorLayer extends VectorLayer<VectorSource> {
    override createRenderer(): CanvasVectorLayerRenderer {
        return new SubpixelCanvasVectorLayerRenderer(this);
    }
}
