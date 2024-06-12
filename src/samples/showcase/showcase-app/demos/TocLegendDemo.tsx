// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Text } from "@open-pioneer/chakra-integration";
import { Legend } from "@open-pioneer/legend";
import { Layer } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { Toc } from "@open-pioneer/toc";
import { useIntl } from "open-pioneer:react-hooks";
import { useId } from "react";
import { MAP_ID } from "../MapConfigProviderImpl";
import { Demo, SharedDemoOptions } from "./Demo";

export function createTocAndLegendDemo({ intl, mapModel }: SharedDemoOptions): Demo {
    return {
        id: "tocLegend",
        title: intl.formatMessage({ id: "demos.tocLegend.title" }),
        createModel() {
            function setDemoLayerVisible(visible: boolean = true): void {
                const layer = mapModel.layers.getLayerById("verwaltungsgebiete") as Layer;
                layer.setVisible(visible);
            }
            function resetDemoLayers(): void {
                setDemoLayerVisible(false);
                mapModel?.layers.activateBaseLayer("osm");
            }
            return {
                description: intl.formatMessage({ id: "demos.tocLegend.description" }),
                mainWidget: <TocLegendView />,
                destroy: resetDemoLayers
            };
        }
    };
}

function TocLegendView() {
    const tocTitleId = useId();
    const legendTitleId = useId();
    const intl = useIntl();

    return (
        <>
            <Box role="dialog" aria-labelledby={tocTitleId}>
                <TitledSection
                    title={
                        <SectionHeading id={tocTitleId} size="md" mb={2}>
                            <Text>
                                {intl.formatMessage({
                                    id: "demos.tocLegend.tocTitle"
                                })}
                            </Text>
                        </SectionHeading>
                    }
                >
                    {/*todo responsive design*/}
                    <Box overflowY="auto" maxHeight={200}>
                        <Toc
                            mapId={MAP_ID}
                            showTools={true}
                            basemapSwitcherProps={{
                                allowSelectingEmptyBasemap: true
                            }}
                        />
                    </Box>
                </TitledSection>
            </Box>
            <Box role="dialog" aria-labelledby={legendTitleId}>
                <TitledSection
                    title={
                        <SectionHeading id={legendTitleId} size="md" mb={2}>
                            {intl.formatMessage({
                                id: "demos.tocLegend.legendTitle"
                            })}
                        </SectionHeading>
                    }
                >
                    {/*todo responsive design*/}
                    <Box overflowY="auto" maxHeight={300}>
                        <Legend mapId={MAP_ID} showBaseLayers={true} />
                    </Box>
                </TitledSection>
            </Box>
        </>
    );
}
