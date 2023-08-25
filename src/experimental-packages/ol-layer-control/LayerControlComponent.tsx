// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import {
    Checkbox,
    ScaleFade,
    Slider,
    SliderFilledTrack,
    SliderThumb,
    SliderTrack,
    Tooltip
} from "@open-pioneer/chakra-integration";
import { LayerModel, MapModel, useMapModel } from "@open-pioneer/map";
import { unByKey } from "ol/Observable";
import { useIntl } from "open-pioneer:react-hooks";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { useTimeout } from "react-use";

export interface LayerControlProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Sets visibility of opacity slider
     */
    showOpacitySlider?: boolean;
}

export function LayerControlComponent(props: LayerControlProps) {
    const intl = useIntl();
    const state = useMapModel(props.mapId);

    // Small timeout before "Loading..." to optimize for the common case where the map
    // is available almost immediately. This prevents some flickering in the UI.
    const [hasTimeoutElapsed] = useTimeout(100);
    const fadeIn = state.kind !== "loading" || hasTimeoutElapsed() || false;

    let content;
    switch (state.kind) {
        case "loading":
            content = <div>{intl.formatMessage({ id: "loading" })}</div>;
            break;
        case "rejected":
            content = (
                <div>
                    {intl.formatMessage({ id: "error" })} {state.error!.message}
                </div>
            );
            break;
        case "resolved":
            content = <LayerList map={state.map!} {...props} />;
            break;
    }

    return (
        <ScaleFade className="layer-control" in={fadeIn}>
            {content}
        </ScaleFade>
    );
}

function LayerList(props: { map: MapModel } & LayerControlProps): JSX.Element {
    const { map, showOpacitySlider } = props;
    const layers = useLayers(map);

    return (
        <div className="layer-list">
            {layers.map((layer, i) => (
                <div key={i} className="layer-entry">
                    <LayerVisibilityTogglerComponent layer={layer} />
                    {showOpacitySlider && <LayerOpacitySliderComponent layer={layer} />}
                </div>
            ))}
        </div>
    );
}

function LayerVisibilityTogglerComponent(props: { layer: LayerModel }): JSX.Element {
    const { layer } = props;
    const intl = useIntl();
    const visible = useVisibility(layer);
    const title = useTitle(layer) || intl.formatMessage({ id: "undefined-layer-title" });
    const changeVisibility = () => {
        layer.setVisible(!visible);
    };

    return (
        <Checkbox
            className="layer-select"
            size="lg"
            isChecked={visible}
            onChange={changeVisibility}
        >
            {title}
        </Checkbox>
    );
}

function LayerOpacitySliderComponent(props: { layer: LayerModel }) {
    const { layer } = props;
    const intl = useIntl();
    const rawOpacity = useOpacity(layer); // [0, 1]
    const displayOpacity = rawOpacity * 100;
    const opacityLabel = intl.formatNumber(displayOpacity, { maximumFractionDigits: 2 }) + "%";
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <Slider
            id="slider"
            value={displayOpacity}
            min={0}
            max={100}
            colorScheme="teal"
            onChange={(v) => layer.olLayer.setOpacity(v / 100)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <SliderTrack>
                <SliderFilledTrack />
            </SliderTrack>
            <Tooltip
                hasArrow
                bg="teal.500"
                color="white"
                placement="top"
                isOpen={showTooltip}
                label={opacityLabel}
            >
                <SliderThumb bg="teal.500"></SliderThumb>
            </Tooltip>
        </Slider>
    );
}

function useLayers(mapModel: MapModel): LayerModel[] {
    // Caches potentially expensive layers arrays.
    // Not sure if this is a good idea, but getSnapshot() should always be fast.
    // If this is a no-go, make getAllLayers() fast instead.
    const cachedArray = useRef<LayerModel[] | undefined>();
    const subscribe = useCallback(
        (cb: () => void) => {
            const resource = mapModel.layers.on("changed", () => {
                cachedArray.current = undefined;
                cb();
            });
            return () => resource.destroy();
        },
        [mapModel]
    );
    const getSnapshot = useCallback(() => {
        // reverse() -> show topmost layers on top
        return (cachedArray.current ??= mapModel.layers.getAllLayers().reverse());
    }, [mapModel]);
    return useSyncExternalStore(subscribe, getSnapshot);
}

function useVisibility(layer: LayerModel): boolean {
    const subscribe = useCallback(
        (cb: () => void) => {
            const resource = layer.on("changed:visible", cb);
            return () => resource.destroy();
        },
        [layer]
    );
    const getSnapshot = useCallback(() => {
        return layer.visible;
    }, [layer]);
    return useSyncExternalStore(subscribe, getSnapshot);
}

function useOpacity(layer: LayerModel): number {
    const subscribe = useCallback(
        (cb: () => void) => {
            const key = layer.olLayer.on("change:opacity", cb);
            return () => unByKey(key);
        },
        [layer]
    );
    const getSnapshot = useCallback(() => {
        return layer.olLayer.getOpacity();
    }, [layer]);
    return useSyncExternalStore(subscribe, getSnapshot);
}

function useTitle(layer: LayerModel): string {
    const subscribe = useCallback(
        (cb: () => void) => {
            const resource = layer.on("changed:title", cb);
            return () => resource.destroy();
        },
        [layer]
    );
    const getSnapshot = useCallback(() => {
        return layer.title;
    }, [layer]);
    return useSyncExternalStore(subscribe, getSnapshot);
}
