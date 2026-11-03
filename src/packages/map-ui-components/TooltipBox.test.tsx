// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TooltipBox } from "./TooltipBox";

it("renders its content in a box styled like a tooltip", async () => {
    render(
        <PackageContextProvider>
            <TooltipBox data-testid="tooltip-box">Tooltip Content</TooltipBox>
        </PackageContextProvider>
    );

    const box = screen.getByTestId("tooltip-box");
    expect(box.textContent).toBe("Tooltip Content");
    expect(box.classList.contains("tooltip-box")).toBe(true);
    expect(box).toMatchSnapshot();

    // Chakra's tooltip recipe defines the background via the `--tooltip-bg` css variable.
    const styles = getEmittedStyles(box);
    expect(styles).toContain("--tooltip-bg:var(--chakra-colors-bg-inverted)");
    expect(styles).toContain("background:var(--tooltip-bg)");
});

it("supports additional class names and style props", async () => {
    render(
        <PackageContextProvider>
            <TooltipBox data-testid="tooltip-box" className="my-tooltip" maxW="none">
                Tooltip Content
            </TooltipBox>
        </PackageContextProvider>
    );

    const box = screen.getByTestId("tooltip-box");
    expect(box.classList.contains("tooltip-box")).toBe(true);
    expect(box.classList.contains("my-tooltip")).toBe(true);

    const styles = getEmittedStyles(box);
    expect(styles).toContain("--tooltip-bg:"); // recipe styles are still applied
    expect(styles).toContain("max-width:none"); // in addition to the custom style prop
});

/**
 * Returns the css rules emitted by chakra (via emotion) for the given element.
 *
 * TODO(browser-tests): this would be _much_ simpler using vitest's browser mode.
 * We only need to know that _something_ from the tooltip recipe is applied.
 * We could getComputedStyles() for that purpose.
 */
function getEmittedStyles(element: HTMLElement): string {
    const generatedClasses = Array.from(element.classList).filter((cls) => cls.startsWith("css-"));
    expect(generatedClasses.length).toBeGreaterThan(0);

    const styleElements = Array.from(document.querySelectorAll("style[data-emotion]"));
    return styleElements
        .map((style) => style.textContent ?? "")
        .filter((cssText) => generatedClasses.some((cls) => cssText.includes(`.${cls}{`)))
        .join("\n");
}
