// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Flex,
    HStack,
    Popover,
    Portal,
    UseTooltipProps,
    usePopoverContext
} from "@chakra-ui/react";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { RefObject, useState } from "react";
import {
    LuImages,
    LuMenu,
    LuMousePointerClick,
    LuPencil,
    LuPencilOff,
    LuPrinter,
    LuRuler,
    LuSquareDashedMousePointer,
    LuTextSearch
} from "react-icons/lu";
import { TbPolygon, TbPolygonOff } from "react-icons/tb";
import { AppModel } from "../AppModel";

export function MapTools() {
    const intl = useIntl();
    const appModel = useService<AppModel>("ol-app.AppModel");
    const resultListState = useReactiveSnapshot(() => appModel.resultListState, [appModel]);
    const resultListOpen = resultListState.open;

    const { isTocActive, isLegendActive, isPrintingActive } = useReactiveSnapshot(() => {
        return {
            isTocActive: appModel.mainContent.includes("toc"),
            isLegendActive: appModel.mainContent.includes("legend"),
            isPrintingActive: appModel.mainContent.includes("printing")
        };
    }, [appModel]);

    return (
        <Flex
            role="toolbar"
            aria-label={intl.formatMessage({ id: "ariaLabel.toolbar" })}
            direction="column"
            gap={1}
            padding={1}
        >
            <InteractionsMenu />

            {resultListState.input && (
                <ToolButton
                    label={intl.formatMessage({ id: "resultListTitle" })}
                    icon={<LuTextSearch />}
                    active={resultListState.open}
                    onClick={() => appModel.setResultListVisibility(!resultListOpen)}
                />
            )}

            <ToolButton
                label={intl.formatMessage({ id: "tocTitle" })}
                icon={<LuMenu />}
                active={isTocActive}
                onClick={() => appModel.toggleMainContent("toc")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "legendTitle" })}
                icon={<LuImages />}
                active={isLegendActive}
                onClick={() => appModel.toggleMainContent("legend")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "printingTitle" })}
                icon={<LuPrinter />}
                active={isPrintingActive}
                onClick={() => appModel.toggleMainContent("printing")}
            />
            <InitialExtent />
            <ZoomIn />
            <ZoomOut />
        </Flex>
    );
}

function InteractionsMenu() {
    const intl = useIntl();
    const appModel = useService<AppModel>("ol-app.AppModel");
    const [visible, setVisible] = useState(false);

    const { isSelectionActive, isMeasurementActive, isEditingCreateActive, isEditingUpdateActive } =
        useReactiveSnapshot(() => {
            return {
                isSelectionActive: appModel.mainContent.includes("selection"),
                isMeasurementActive: appModel.mainContent.includes("measurement"),
                isEditingCreateActive: appModel.mainContent.includes("editing-create"),
                isEditingUpdateActive: appModel.mainContent.includes("editing-update")
            };
        }, [appModel]);

    // Calls the handler and also closes the popover menu
    const interactionsMenuHandler = (handler: () => void) => {
        return () => {
            handler();
            setVisible(false);
        };
    };

    const tooltipProps: Partial<UseTooltipProps> = {
        positioning: { placement: "top" }
    };
    const interactionButtons = (
        <>
            <ToolButton
                label={
                    isEditingCreateActive
                        ? intl.formatMessage({ id: "editing.stopTitle" })
                        : intl.formatMessage({ id: "editing.create.startTitle" })
                }
                icon={isEditingCreateActive ? <TbPolygonOff /> : <TbPolygon />}
                active={isEditingCreateActive}
                onClick={interactionsMenuHandler(() =>
                    appModel.toggleMainContent("editing-create")
                )}
                tooltipProps={tooltipProps}
            />
            <ToolButton
                label={
                    isEditingUpdateActive
                        ? intl.formatMessage({ id: "editing.stopTitle" })
                        : intl.formatMessage({ id: "editing.update.startTitle" })
                }
                icon={isEditingUpdateActive ? <LuPencilOff /> : <LuPencil />}
                active={isEditingUpdateActive}
                onClick={interactionsMenuHandler(() =>
                    appModel.toggleMainContent("editing-update")
                )}
                tooltipProps={tooltipProps}
            />
            <ToolButton
                label={intl.formatMessage({ id: "measurementTitle" })}
                icon={<LuRuler />}
                active={isMeasurementActive}
                onClick={interactionsMenuHandler(() => appModel.toggleMainContent("measurement"))}
                tooltipProps={tooltipProps}
            />
            <ToolButton
                label={intl.formatMessage({ id: "selectionTitle" })}
                icon={<LuSquareDashedMousePointer />}
                active={isSelectionActive}
                onClick={interactionsMenuHandler(() => appModel.toggleMainContent("selection"))}
                tooltipProps={tooltipProps}
            />
        </>
    );

    return (
        <Popover.Root
            positioning={{ placement: "left" }}
            lazyMount={true}
            onOpenChange={(e) => setVisible(e.open)}
            open={visible}
        >
            <Popover.Trigger asChild>
                <PopoverTriggerTool />
            </Popover.Trigger>
            <Portal>
                <Popover.Positioner>
                    <Popover.Content width="auto">
                        <Popover.Arrow />
                        <Popover.Body padding={2}>
                            <HStack gap={2}>{interactionButtons}</HStack>
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    );
}

// The dance with `context` and `buttonProps` is necessary here to set the aria attributes
// defined by the popover (e.g. aria-controls).
// It would not be required if ToolButton would accept those props directly.
const PopoverTriggerTool = function PopoverTriggerTool({
    ref
}: {
    ref?: RefObject<HTMLButtonElement>;
}) {
    const intl = useIntl();
    const context = usePopoverContext();
    const { onClick, ...triggerProps } = context.getTriggerProps();
    return (
        <ToolButton
            ref={ref}
            label={intl.formatMessage({ id: "mapInteractions.title" })}
            icon={<LuMousePointerClick />}
            onClick={onClick}
            buttonProps={triggerProps}
            tooltipProps={{
                ids: {
                    // Mixing Popup and menu/popover triggers requires some coordination.
                    // We tell the tooltip to watch the same dom element as the popover trigger.
                    // See https://chakra-ui.com/docs/components/tooltip#with-menutrigger
                    trigger: triggerProps.id
                }
            }}
        />
    );
};
