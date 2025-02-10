// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { expect, it } from "vitest";
import { MapAnchorPosition } from "./MapAnchor";
import { PADDING_BOTTOM, PADDING_LEFT, PADDING_RIGHT, PADDING_TOP } from "./CssProps";
import { StyleProps } from "@open-pioneer/chakra-integration";
import { computeMapAnchorStyles } from "./computeMapAnchorStyles";

it("should successfully create position styles on `top-left` without gap", async () => {
    const position: MapAnchorPosition = "top-left";
    PADDING_TOP.definition = "10px";
    PADDING_BOTTOM.definition = "10px";
    PADDING_LEFT.definition = "10px";
    PADDING_RIGHT.definition = "10px";

    const styleProps: StyleProps = computeMapAnchorStyles(position);
    expect(styleProps.left).toBe("calc((var(--map-padding-left) + 0px))");
    expect(styleProps.top).toBe("calc((var(--map-padding-top) + 0px))");
    expect(styleProps.maxH).toBe(
        "calc((100%) - (var(--map-padding-top) + 0px) - 30px - 0px - 10px)"
    );
    expect(styleProps.maxW).toBe("calc((100%) - (var(--map-padding-left) + 0px) - 0px - 0px)");
});

it("should successfully create position styles on `top-left` with horizontalGap and verticalGap", async () => {
    const position: MapAnchorPosition = "top-left";
    PADDING_TOP.definition = "10px";
    PADDING_BOTTOM.definition = "10px";
    PADDING_LEFT.definition = "10px";
    PADDING_RIGHT.definition = "10px";

    const styleProps: StyleProps = computeMapAnchorStyles(position, 50, 25);
    expect(styleProps.left).toBe("calc((var(--map-padding-left) + 50px))");
    expect(styleProps.top).toBe("calc((var(--map-padding-top) + 25px))");
    expect(styleProps.maxH).toBe(
        "calc((100%) - (var(--map-padding-top) + 25px) - 0px - 25px - 10px)"
    );
    expect(styleProps.maxW).toBe("calc((100%) - (var(--map-padding-left) + 50px) - 0px - 50px)");
});

it("should successfully create position styles on `bottom-right` with horizontalGap and verticalGap", async () => {
    const position: MapAnchorPosition = "bottom-right";
    PADDING_TOP.definition = "10px";
    PADDING_BOTTOM.definition = "10px";
    PADDING_LEFT.definition = "10px";
    PADDING_RIGHT.definition = "10px";

    const styleProps: StyleProps = computeMapAnchorStyles(position, 50, 25);
    expect(styleProps.right).toBe("calc((var(--map-padding-right) + 50px))");
    expect(styleProps.bottom).toBe("calc((var(--map-padding-bottom) + 25px))");
    expect(styleProps.maxH).toBe(
        "calc((100%) - 0px - (var(--map-padding-bottom) + 25px) - 25px - 10px)"
    );
    expect(styleProps.maxW).toBe("calc((100%) - 0px - (var(--map-padding-right) + 50px) - 50px)");
});

it("should successfully create position styles on `bottom-h-center` without gap", async () => {
    const position: MapAnchorPosition = "bottom-h-center";
    PADDING_TOP.definition = "10px";
    PADDING_BOTTOM.definition = "10px";
    PADDING_LEFT.definition = "10px";
    PADDING_RIGHT.definition = "10px";

    const styleProps: StyleProps = computeMapAnchorStyles(position, 0, 0);
    expect(styleProps.left).toBe("calc((var(--map-padding-left) + 0px))");
    expect(styleProps.bottom).toBe("calc((var(--map-padding-bottom) + 0px))");
    expect(styleProps.maxH).toBe(
        "calc((100%) - 0px - (var(--map-padding-bottom) + 0px) - 0px - 10px)"
    );
    expect(styleProps.maxW).toBe(
        "calc((100%) - (var(--map-padding-left) + 0px) - (var(--map-padding-right) + 0px) - 0px)"
    );
});
