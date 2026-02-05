// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { MapModel } from "../model/MapModel";
import { Overlay } from "../model/Overlays";
import { createPortal } from "react-dom";

export function OverlaysRenderer(props: { map: MapModel }) {
    const { map } = props;
    const overlays = useReactiveSnapshot(() => {
        return map.overlays.getOverlays();
    }, [map]);
    return overlays.map((overlay) => <OverlayRenderer key={overlay.id} overlay={overlay} />);
}

function OverlayRenderer(props: { overlay: Overlay }) {
    const { overlay } = props;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const target = overlay.olOverlay.getElement()!; // not reactive, always the same
    const content = useReactiveSnapshot(() => overlay.content, [overlay]);
    return createPortal(content, target);
}
