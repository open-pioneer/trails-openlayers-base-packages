// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Flex,
    HStack,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverContent,
    PopoverTrigger,
    Portal,
    TooltipProps,
    usePopoverContext
} from "@open-pioneer/chakra-integration";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { ForwardedRef, forwardRef, useState } from "react";
import {
    PiCursorClick,
    PiImagesLight,
    PiListLight,
    PiListMagnifyingGlassFill,
    PiPencil,
    PiPencilSlash,
    PiPrinterLight,
    PiRulerLight,
    PiSelectionPlusBold
} from "react-icons/pi";
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
                    icon={<PiListMagnifyingGlassFill />}
                    isActive={resultListState.open}
                    onClick={() => appModel.setResultListVisibility(!resultListOpen)}
                />
            )}

            <ToolButton
                label={intl.formatMessage({ id: "tocTitle" })}
                icon={<PiListLight />}
                isActive={isTocActive}
                onClick={() => appModel.toggleMainContent("toc")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "legendTitle" })}
                icon={<PiImagesLight />}
                isActive={isLegendActive}
                onClick={() => appModel.toggleMainContent("legend")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "printingTitle" })}
                icon={<PiPrinterLight />}
                isActive={isPrintingActive}
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

    const tooltipProps: Partial<TooltipProps> = {
        placement: "top"
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
                isActive={isEditingCreateActive}
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
                icon={isEditingUpdateActive ? <PiPencilSlash /> : <PiPencil />}
                isActive={isEditingUpdateActive}
                onClick={interactionsMenuHandler(() =>
                    appModel.toggleMainContent("editing-update")
                )}
                tooltipProps={tooltipProps}
            />
            <ToolButton
                label={intl.formatMessage({ id: "measurementTitle" })}
                icon={<PiRulerLight />}
                isActive={isMeasurementActive}
                onClick={interactionsMenuHandler(() => appModel.toggleMainContent("measurement"))}
                tooltipProps={tooltipProps}
            />
            <ToolButton
                label={intl.formatMessage({ id: "selectionTitle" })}
                icon={<PiSelectionPlusBold />}
                isActive={isSelectionActive}
                onClick={interactionsMenuHandler(() => appModel.toggleMainContent("selection"))}
                tooltipProps={tooltipProps}
            />
        </>
    );

    return (
        <Popover
            placement="left"
            isLazy
            onOpen={() => setVisible(true)}
            onClose={() => setVisible(false)}
            isOpen={visible}
        >
            <PopoverTrigger>
                <PopoverTriggerTool />
            </PopoverTrigger>
            <Portal>
                <PopoverContent width="auto">
                    <PopoverArrow />
                    <PopoverBody>
                        <HStack spacing={2}>{interactionButtons}</HStack>
                    </PopoverBody>
                </PopoverContent>
            </Portal>
        </Popover>
    );
}

// The dance with `context` and `buttonProps` is necessary here to set the aria attributes
// defined by the popover (e.g. aria-controls).
// It would not be required if ToolButton would accept those props directly.
const PopoverTriggerTool = forwardRef(function PopoverTriggerTool(
    _,
    ref: ForwardedRef<HTMLButtonElement>
) {
    const intl = useIntl();
    const context = usePopoverContext();
    const { onClick, ...triggerProps } = context.getTriggerProps();
    return (
        <ToolButton
            ref={ref}
            label={intl.formatMessage({ id: "mapInteractions.title" })}
            icon={<PiCursorClick />}
            onClick={onClick}
            buttonProps={triggerProps}
        />
    );
});
