// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Highlight, MapModel, SimpleLayer } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import { useEvent } from "@open-pioneer/react-utils";
import {
    SelectionCompleteEvent,
    SelectionResult,
    SelectionSource,
    SelectionSourceChangedEvent,
    VectorLayerSelectionSourceFactory
} from "@open-pioneer/selection";
import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { PLACES_LAYER_ID } from "./MapConfigProviderImpl";
import { DummySource, FailingSelectionSource } from "./sources";

/** The results of the most recent selection. */
export interface LastSelection {
    sourceLabel: string;
    results: SelectionResult[];
}

/** State and event handlers used by the demo UI. */
export interface SelectionDemo {
    /** The sources that are currently passed to the selection component. */
    sources: SelectionSource[];

    /** The results of the most recent selection (they are highlighted on the map). */
    lastSelection: LastSelection | undefined;

    /** Removes the highlights and the result summary. */
    clearResults(): void;

    /** Adds or removes the test source from the component's sources list. */
    toggleRemovableSource(): void;

    /** Shows or hides the vector layer (this also changes the status of its selection source). */
    togglePlacesLayer(): void;

    /** Event handlers called by the selection component (for notifications). */
    onSelectionComplete(event: SelectionCompleteEvent): void;
    onSelectionSourceChanged(event: SelectionSourceChangedEvent): void;
}

/**
 * Sets up the selection sources of this app and the state needed to manipulate them at runtime.
 */
export function useSelectionDemo(map: MapModel): SelectionDemo {
    const intl = useIntl();
    const notifier = useService<NotificationService>("notifier.NotificationService");
    const vectorSelectionSourceFactory = useService<VectorLayerSelectionSourceFactory>(
        "selection.VectorSelectionSourceFactory"
    );

    const [demo, setDemo] = useState<DemoSources>();
    useEffect(() => {
        const currentDemo = createDemoSources(map, vectorSelectionSourceFactory);
        setDemo(currentDemo);
        return () => currentDemo.destroy();
    }, [map, vectorSelectionSourceFactory]);

    const [sourceFiltered, setSourceFiltered] = useState(false);
    const sources = useMemo(
        () =>
            demo?.sources.filter((source) =>
                sourceFiltered ? source.id !== "dummy-removable" : true
            ) ?? [],
        [demo, sourceFiltered]
    );

    // The results of the most recent selection are highlighted on the map.
    const [lastSelection, setLastSelection] = useState<LastSelection>();
    const highlight = useRef<Highlight | undefined>(undefined);
    useEffect(() => () => highlight.current?.destroy(), []);

    const clearResults = useEvent(() => {
        highlight.current?.destroy();
        highlight.current = undefined;
        setLastSelection(undefined);
    });

    const onSelectionComplete = useEvent((event: SelectionCompleteEvent) => {
        const { source, results } = event;

        clearResults();
        if (results.length > 0) {
            highlight.current = map.highlights.addAndZoom(results, { maxZoom: 15 });
        }
        setLastSelection({ sourceLabel: source.label, results });

        notifier.notify({
            level: results.length > 0 ? "info" : "warning",
            message: intl.formatMessage(
                { id: "selectionComplete" },
                { count: results.length, source: source.label }
            ),
            displayDuration: 3000
        });
    });

    const onSelectionSourceChanged = useEvent((event: SelectionSourceChangedEvent) => {
        // This event is also emitted with `undefined` when the current source is removed
        // from the `sources` property, and once with the initial source after mounting.
        notifier.notify({
            level: "info",
            message: event.source
                ? intl.formatMessage({ id: "sourceChanged" }, { source: event.source.label })
                : intl.formatMessage({ id: "sourceCleared" }),
            displayDuration: 2000
        });
    });

    return {
        sources,
        lastSelection,
        clearResults,
        toggleRemovableSource() {
            setSourceFiltered((filtered) => !filtered);
        },
        togglePlacesLayer() {
            const layer = demo?.placesLayer;
            if (layer) {
                layer.setVisible(!layer.visible);
            }
        },
        onSelectionComplete,
        onSelectionSourceChanged
    };
}

interface DemoSources {
    sources: SelectionSource[];

    /** The vector layer behind the `VectorLayerSelectionSource`. */
    placesLayer: SimpleLayer;

    destroy(): void;
}

function createDemoSources(
    map: MapModel,
    vectorSelectionSourceFactory: VectorLayerSelectionSourceFactory
): DemoSources {
    const placesLayer = map.layers.getLayerById(PLACES_LAYER_ID) as SimpleLayer | undefined;
    if (!placesLayer) {
        throw new Error("Failed to find places layer");
    }

    // Availability is derived from the layer's visibility.
    const layerSource = vectorSelectionSourceFactory.createSelectionSource({
        id: "places-layer",
        vectorLayer: placesLayer.olLayer as VectorLayer<VectorSource, Feature>,
        label: placesLayer.title
    });

    return {
        sources: [
            layerSource,
            new DummySource({
                id: "dummy-removable",
                label: "No results (can be removed)",
                status: "available"
            }),
            new DummySource({
                id: "dummy-unavailable",
                label: "No results (never available)",
                status: "unavailable"
            }),
            new FailingSelectionSource()
        ],
        placesLayer,
        destroy() {
            layerSource.destroy();
        }
    };
}
