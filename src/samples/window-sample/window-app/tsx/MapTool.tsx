// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SpatialBookmarks } from "@open-pioneer/spatial-bookmarks";
import { Legend } from "@open-pioneer/legend";
import { Measurement } from "@open-pioneer/measurement";
import { Printing } from "@open-pioneer/printing";
import { Toc } from "@open-pioneer/toc";

import { useIntl } from "open-pioneer:react-hooks";
import type { ReactElement } from "react";

import { ToolWindow, type ToolbarStateProps } from "./ToolWindow";

export function MapTool({
    tool,
    toolbarStateKey,
    toolbarState,
    setToolbarState
}: MapToolProps): ReactElement {
    const { formatMessage } = useIntl();

    switch (tool) {
        case "bookmarks":
            return (
                <ToolWindow
                    title={formatMessage({ id: "toolTitle.bookmarks" })}
                    identifier="bookmarks"
                    right={60}
                    bottom={35}
                    width={400}
                    height={310}
                    minWidth={350}
                    minHeight={310}
                    toolbarStateKey={toolbarStateKey}
                    toolbarState={toolbarState}
                    setToolbarState={setToolbarState}
                >
                    <SpatialBookmarks />
                </ToolWindow>
            );

        case "legend":
            return (
                <ToolWindow
                    title={formatMessage({ id: "toolTitle.legend" })}
                    identifier="legend"
                    left={10}
                    bottom={35}
                    width={450}
                    height={350}
                    minWidth={300}
                    minHeight={300}
                    toolbarStateKey={toolbarStateKey}
                    toolbarState={toolbarState}
                    setToolbarState={setToolbarState}
                >
                    <Legend />
                </ToolWindow>
            );

        case "measurement":
            return (
                <ToolWindow
                    title={formatMessage({ id: "toolTitle.measurement" })}
                    identifier="measurement"
                    top={10}
                    right={10}
                    width={300}
                    height={250}
                    resizable={false}
                    toolbarStateKey={toolbarStateKey}
                    toolbarState={toolbarState}
                    setToolbarState={setToolbarState}
                >
                    <Measurement />
                </ToolWindow>
            );

        case "printing":
            return (
                <ToolWindow
                    title={formatMessage({ id: "toolTitle.printing" })}
                    identifier="printing"
                    right={10}
                    top={270}
                    width={350}
                    height={250}
                    minWidth={300}
                    minHeight={250}
                    maxWidth={400}
                    maxHeight={400}
                    toolbarStateKey={toolbarStateKey}
                    toolbarState={toolbarState}
                    setToolbarState={setToolbarState}
                >
                    <Printing />
                </ToolWindow>
            );

        case "toc":
            return (
                <ToolWindow
                    title={formatMessage({ id: "toolTitle.toc" })}
                    identifier="toc"
                    top={10}
                    left={10}
                    width={280}
                    height={450}
                    minWidth={250}
                    minHeight={250}
                    toolbarStateKey={toolbarStateKey}
                    toolbarState={toolbarState}
                    setToolbarState={setToolbarState}
                >
                    <Toc />
                </ToolWindow>
            );
    }
}

interface MapToolProps extends ToolbarStateProps {
    readonly tool: Tool;
}

type Tool = "bookmarks" | "legend" | "measurement" | "printing" | "toc";
