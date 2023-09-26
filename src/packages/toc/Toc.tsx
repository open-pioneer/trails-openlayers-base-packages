// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { Box, Text, BoxProps, Heading } from "@open-pioneer/chakra-integration";
import {
    FC,
    ForwardedRef,
    forwardRef,
    RefAttributes,
    useCallback,
    useRef,
    useSyncExternalStore
} from "react";
import classNames from "classnames";
import { BasemapSwitcher, BasemapSwitcherProps } from "@open-pioneer/basemap-switcher";
import { useIntl } from "open-pioneer:react-hooks";
import { LayerModel, MapModel, useMapModel } from "@open-pioneer/map";

export interface TocProps extends BoxProps, RefAttributes<HTMLDivElement> {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Additional css class name(s) that will be added to the Toc component.
     */
    className?: string;

    /**
     * Defines whether the basemap switcher is shown in the toc.
     * Defaults to false.
     */
    hideBasemapSwitcher?: boolean;

    /**
     * Properties for the embedded basemap switcher.
     * Property "mapId" is not applied.
     */
    basemapSwitcherProps?: Omit<BasemapSwitcherProps, "mapId">;
}

export const Toc: FC<TocProps> = forwardRef(function Toc(
    props: TocProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const intl = useIntl();

    const { mapId, className, hideBasemapSwitcher = false, basemapSwitcherProps, ...rest } = props;
    const basemapsLabel = intl.formatMessage({ id: "basemapsLabel" });
    const tocTitel = intl.formatMessage({ id: "tocTitel" });

    const state = useMapModel(mapId);

    let content;
    switch (state.kind) {
        case "loading":
            content = <div></div>;
            break;
        case "rejected":
            content = <div>{intl.formatMessage({ id: "error" })}</div>;
            break;
        case "resolved":
            content = <LayerList map={state.map!} {...props} />;
            break;
    }

    return (
        <Box className={classNames("toc", className)} ref={ref} {...rest}>
            {/*TODO: remove header as it should be added by an app developer if needed? */}
            <Box
                className="toc-header"
                padding={2}
                backgroundColor="var(--chakra-colors-blackAlpha-500)"
            >
                <Text as="b">{tocTitel}</Text>
            </Box>
            {hideBasemapSwitcher || (
                /**
                 *  todo use useId to generate ID
                 *  todo test is basemapSwitcherProps are applied correctly (even with aria-labelledby)
                 * todo use TitledSection instead of Heading:
                 * <TitledSection
                 *     title={
                 *         <SectionHeading size="4xl">Heading</SectionHeading>
                 *     }
                 * >
                 *     Content
                 * </TitledSection>
                 * todo fix tests when done
                 */
                <Box className="toc-basemap-switcher" padding={2}>
                    <Heading as={"h2"} id={"sljdkf"}>
                        lsjdfl
                    </Heading>
                    <BasemapSwitcher
                        aria-labelledby={"sljdkf"}
                        {...basemapSwitcherProps}
                        mapId={mapId}
                    ></BasemapSwitcher>
                </Box>
            )}
            {/*todo use TitledSection instead of Heading: */}
            <Box padding={2}>
                <Heading>Test</Heading>
                {content}
            </Box>
        </Box>
    );

    function LayerList(props: { map: MapModel }): JSX.Element {
        const { map } = props;
        const layers = useLayers(map);

        // todo use chakra ListItem with check-box inside (use checkbox label for layer titel)
        // todo ensure to sync with map model

        return (
            <div className="layer-list">
                {layers.map((layer, i) => (
                    <div key={i} className="layer-entry">
                        {layer.title}
                    </div>
                ))}
            </div>
        );
    }
});

function useLayers(mapModel: MapModel): LayerModel[] {
    // Caches potentially expensive layers arrays.
    // Not sure if this is a good idea, but getSnapshot() should always be fast.
    // If this is a no-go, make getAllLayers() fast instead.
    const flatOperationalLayers = useRef<LayerModel[] | undefined>();
    const subscribe = useCallback(
        (cb: () => void) => {
            // Reset cache when (re-) subscribing
            flatOperationalLayers.current = undefined;

            if (!mapModel) {
                return () => undefined;
            }
            const resource = mapModel.layers.on("changed", () => {
                // Reset cache content so getSnapshot() fetches layers again.
                flatOperationalLayers.current = undefined;
                cb();
            });
            return () => resource.destroy();
        },
        [mapModel]
    );
    const getSnapshot = useCallback(() => {
        if (flatOperationalLayers.current) {
            return flatOperationalLayers.current;
        }
        // todo skip groupLayer, skip basemaps

        const operationalLayers = mapModel?.layers.getOperationalLayers() ?? [];
        operationalLayers.filter((layerModelImpl) => {});
        flatOperationalLayers.current = operationalLayers;

        return flatOperationalLayers.current;
    }, [mapModel]);
    return useSyncExternalStore(subscribe, getSnapshot);
}
