// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { BasemapSwitcher, BasemapSwitcherProps } from "@open-pioneer/basemap-switcher";
import { Box, Text } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils/TitledSection";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useId } from "react";
import { LayerList } from "./LayerList";

/**
 * Props supported by the {@link Toc} component.
 */
export interface TocProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

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
export const Toc: FC<TocProps> = (props: TocProps) => {
    const intl = useIntl();

    const { mapId, showBasemapSwitcher = true, basemapSwitcherProps } = props;
    const { containerProps } = useCommonComponentProps("toc", props);
    const basemapsHeadingId = useId();
    const operationalLayersHeadingId = useId();
    const state = useMapModel(mapId);

    let content: JSX.Element | null;
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
                            <SectionHeading id={basemapsHeadingId} size={"sm"} mb={PADDING}>
                                {intl.formatMessage({ id: "basemapsLabel" })}
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
                            <SectionHeading
                                id={operationalLayersHeadingId}
                                size={"sm"}
                                mb={PADDING}
                            >
                                {intl.formatMessage({ id: "operationalLayerLabel" })}
                            </SectionHeading>
                        }
                    >
                        <LayerList map={state.map!} aria-labelledby={operationalLayersHeadingId} />
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

    return <Box {...containerProps}>{content}</Box>;
};
