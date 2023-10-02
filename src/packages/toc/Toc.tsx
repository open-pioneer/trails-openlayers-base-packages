// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { BasemapSwitcher, BasemapSwitcherProps } from "@open-pioneer/basemap-switcher";
import { Box, BoxProps, Text } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils/TitledSection";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, ForwardedRef, RefAttributes, forwardRef, useId } from "react";
import { LayerList } from "./LayerList";

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
     * Defaults to true.
     */
    showBasemapSwitcher?: boolean;

    /**
     * Properties for the embedded basemap switcher.
     * Property "mapId" is not applied.
     */
    basemapSwitcherProps?: Omit<BasemapSwitcherProps, "mapId">;
}

const PADDING = 2;

/**
 * Displays the layers of the configured map.
 */
export const Toc: FC<TocProps> = forwardRef(function Toc(
    props: TocProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const intl = useIntl();

    const { mapId, className, showBasemapSwitcher = true, basemapSwitcherProps, ...rest } = props;
    const basemapsHeadingId = useId();
    const basemapsLabel = intl.formatMessage({ id: "basemapsLabel" });
    const layersLabel = intl.formatMessage({ id: "operationalLayerLabel" });

    const state = useMapModel(mapId);

    let content;
    switch (state.kind) {
        case "loading":
            content = null;
            break;
        case "rejected":
            content = <Text className="toc-error">{intl.formatMessage({ id: "error" })}</Text>;
            break;
        case "resolved": {
            const basemapSwitcher = showBasemapSwitcher && (
                <Box className="toc-basemap-switcher" padding={PADDING}>
                    <TitledSection
                        title={
                            <SectionHeading size={"sm"} id={basemapsHeadingId} mb={PADDING}>
                                {basemapsLabel}
                            </SectionHeading>
                        }
                    >
                        <BasemapSwitcher
                            mapId={mapId}
                            aria-labelledby={basemapsHeadingId}
                            {...basemapSwitcherProps}
                        />
                    </TitledSection>
                </Box>
            );
            const layerList = (
                <Box className="toc-operational-layers" padding={PADDING}>
                    <TitledSection
                        title={
                            <SectionHeading size={"sm"} mb={PADDING}>
                                {layersLabel}
                            </SectionHeading>
                        }
                    >
                        <LayerList map={state.map!} />
                    </TitledSection>
                </Box>
            );

            content = (
                <>
                    {basemapSwitcher}
                    {layerList}
                </>
            );
            break;
        }
    }

    return (
        <Box className={classNames("toc", className)} ref={ref} {...rest}>
            {content}
        </Box>
    );
});
