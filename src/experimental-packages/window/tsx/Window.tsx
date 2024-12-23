// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex } from "@open-pioneer/chakra-integration";
import { Rnd, type ResizeEnable } from "react-rnd";
import { useMemo, type ReactElement, type ReactNode } from "react";

import { TitleBar, DRAG_HANDLE_CLASS_NAME } from "./titlebar/TitleBar";
import { useFrame } from "./frame/useFrame";
import type { WindowFrame } from "./frame/frame";
import { useZIndex } from "./zindex/useZIndex";

export function Window({
    title, identifier, minWidth, minHeight, maxWidth, maxHeight,
    resizable = true, closable = true, draggable = true, dragAnywhere = false,
    children, onClose, ...windowFrame
}: WindowProps): ReactElement {
    const { initialFrame, onResizeStop, onDragStop } = useFrame(identifier, windowFrame);
    const [zIndex, bringToFront] = useZIndex();
    const style = useMemo(() => ({ zIndex }), [zIndex]);

    return (
        <Rnd
            bounds="window"
            default={initialFrame}
            minWidth={minWidth ?? 250}
            minHeight={minHeight ?? 250}
            maxWidth={maxWidth}
            maxHeight={maxHeight}
            style={style}
            dragHandleClassName={!dragAnywhere ? DRAG_HANDLE_CLASS_NAME : undefined}
            enableResizing={resizable}
            disableDragging={!draggable}
            onMouseDown={bringToFront}
            onResizeStart={bringToFront}
            onDragStart={bringToFront}
            onResizeStop={onResizeStop}
            onDragStop={onDragStop}
        >
            <Flex
                direction="column"
                width="full"
                height="full"
                bg="white"
                overflow="hidden"
                border="1px"
                borderColor="gray.300"
                borderRadius="md"
                boxShadow="md"
                zIndex={1}
            >
                <TitleBar title={title} closeable={closable} onClose={onClose} />
                <Box flex="1" padding="15px" overflow="auto">
                    {children}
                </Box>
            </Flex>
        </Rnd>
    );
}

export type WindowProps = AdditionalWindowProps & WindowFrame;

export interface AdditionalWindowProps {
    readonly title?: string;
    readonly identifier?: string;

    readonly minWidth?: number;
    readonly minHeight?: number;
    readonly maxWidth?: number;
    readonly maxHeight?: number;

    readonly resizable?: ResizeEnable;
    readonly closable?: boolean;
    readonly draggable?: boolean;
    readonly dragAnywhere?: boolean;

    readonly children?: ReactNode | ReactNode[];
    readonly onClose?: () => void;
}

export type { WindowFrame };
