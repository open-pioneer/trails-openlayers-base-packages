// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Flex } from "@chakra-ui/react";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useState } from "react";

import { Chart, useChart } from "@chakra-ui/charts";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

export function AppUI() {
    const [chartBool, setChartBool] = useState<number>(0);
    const chart = useChart({
        data: [
            { sale: 10, month: "January" },
            { sale: 95, month: "February" },
            { sale: 87, month: "March" },
            { sale: 88, month: "May" },
            { sale: 65, month: "June" },
            { sale: 90, month: "August" }
        ],
        series: [{ name: "sale", color: "teal.solid" }]
    });
    const chart2 = useChart({
        data: [
            { month: "January", value: 100 },
            { month: "February", value: 200 }
        ]
    });

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box textAlign="center" py={1} px={1}>
                        <SectionHeading size="md">Chakra Test App</SectionHeading>
                    </Box>
                }
            >
                <Button onClick={() => setChartBool(chartBool ? 0 : 1)}>Change Chart</Button>
                {chartBool === 0 ? (
                    <Chart.Root maxH="sm" chart={chart}>
                        <LineChart data={chart.data}>
                            <CartesianGrid stroke={chart.color("border")} vertical={false} />
                            <XAxis
                                axisLine={false}
                                dataKey={chart.key("month")}
                                tickFormatter={(value) => value.slice(0, 3)}
                                stroke={chart.color("border")}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickMargin={10}
                                stroke={chart.color("border")}
                            />
                            <Tooltip
                                animationDuration={100}
                                cursor={false}
                                content={<Chart.Tooltip />}
                            />
                            {chart.series.map((item) => (
                                <Line
                                    key={item.name}
                                    isAnimationActive={false}
                                    dataKey={chart.key(item.name)}
                                    stroke={chart.color(item.color)}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    </Chart.Root>
                ) : (
                    <Chart.Root chart={chart2}>
                        <BarChart data={chart.data}>
                            {chart.series.map((item) => (
                                <Bar
                                    key={item.name}
                                    dataKey={chart.key(item.name)}
                                    fill={chart.color(item.color)}
                                />
                            ))}
                        </BarChart>
                    </Chart.Root>
                )}
            </TitledSection>
        </Flex>
    );
}
