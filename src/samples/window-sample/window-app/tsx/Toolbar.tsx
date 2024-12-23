// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { VStack } from "@open-pioneer/chakra-integration";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { useIntl } from "open-pioneer:react-hooks";
import { useCallback, useMemo, type Dispatch, type ReactElement, type SetStateAction } from "react";
import {
    PiBookmarkSimpleLight, PiImagesLight, PiListLight, PiPrinterLight, PiRulerLight
} from "react-icons/pi";

export function Toolbar({ state, setState }: ToolbarProps): ReactElement {
    const { formatMessage } = useIntl();

    const toggleState = useCallback((key: keyof ToolbarState) => {
        setState((state) => ({
            ...state,
            [key]: !state[key]
        }));
    }, [setState]);

    const callbacks = useMemo(() => ({
        toggleBookmarks: () => toggleState("bookmarksAreActive"),
        toggleLegend: () => toggleState("legendIsActive"),
        toggleMeasurement: () => toggleState("measurementIsActive"),
        togglePrinting: () => toggleState("printingIsActive"),
        toggleToc: () => toggleState("tocIsActive")
    }), [toggleState]);

    return (
        <VStack spacing={2}>
            <ToolButton
                label={formatMessage({ id: "toolTitle.toc" })}
                icon={<PiListLight />}
                isActive={state.tocIsActive}
                onClick={callbacks.toggleToc}
            />
            <ToolButton
                label={formatMessage({ id: "toolTitle.legend" })}
                icon={<PiImagesLight />}
                isActive={state.legendIsActive}
                onClick={callbacks.toggleLegend}
            />
            <ToolButton
                label={formatMessage({ id: "toolTitle.bookmarks" })}
                icon={<PiBookmarkSimpleLight />}
                isActive={state.bookmarksAreActive}
                onClick={callbacks.toggleBookmarks}
            />
            <ToolButton
                label={formatMessage({ id: "toolTitle.measurement" })}
                icon={<PiRulerLight />}
                isActive={state.measurementIsActive}
                onClick={callbacks.toggleMeasurement}
            />
            <ToolButton
                label={formatMessage({ id: "toolTitle.printing" })}
                icon={<PiPrinterLight />}
                isActive={state.printingIsActive}
                onClick={callbacks.togglePrinting}
            />
        </VStack>
    );
}

interface ToolbarProps {
    readonly state: ToolbarState;
    readonly setState: Dispatch<SetStateAction<ToolbarState>>;
}

export interface ToolbarState {
    readonly bookmarksAreActive?: boolean;
    readonly legendIsActive?: boolean;
    readonly measurementIsActive?: boolean;
    readonly printingIsActive?: boolean;
    readonly tocIsActive?: boolean;
}
