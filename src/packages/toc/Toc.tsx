// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BasemapSwitcher, BasemapSwitcherProps } from "@open-pioneer/basemap-switcher";
import { Box, Flex, Spacer, Text } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import {
    CommonComponentProps,
    SectionHeading,
    TitledSection,
    useCommonComponentProps
} from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useId } from "react";
import { LayerList } from "./LayerList";
import { TocTools } from "./TocTools";

/**
 * Props supported by the {@link Toc} component.
 */
export interface TocProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Defines whether the toc tools component is shown in the toc.
     * Defaults to `false`.
     */
    showTocTools?: boolean;

    /**
     * Defines whether the basemap switcher is shown in the toc.
     * Defaults to `true`.
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

    const { mapId, showTocTools = false, showBasemapSwitcher = true, basemapSwitcherProps } = props;
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
                <Box className="toc-basemap-switcher">
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
                <Box className="toc-operational-layers">
                    <TitledSection
                        title={
                            <SectionHeading id={operationalLayersHeadingId} size={"sm"} mb={2}>
                                <Flex>
                                    <Text my={3}>
                                        {intl.formatMessage({
                                            id: "operationalLayerLabel"
                                        })}
                                    </Text>
                                    <Spacer />
                                    {showTocTools && <TocTools map={state.map!} />}
                                </Flex>
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

    return (
        <Flex {...containerProps} direction="column" gap={PADDING}>
            {content}
        </Flex>
    );
};
