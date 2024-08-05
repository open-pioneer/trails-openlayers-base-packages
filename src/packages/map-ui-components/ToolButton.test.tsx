// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { ToolButton } from "./ToolButton";
import { createRef } from "react";

it("renders as a button", async () => {
    render(
        <PackageContextProvider>
            <ToolButton label="Button Label" icon={getIcon()} />
        </PackageContextProvider>
    );

    const button = screen.getByLabelText("Button Label");
    expect(button.tagName).toBe("BUTTON");
    expect(button).toMatchSnapshot();
});

it("calls event handler when clicked", async () => {
    const user = userEvent.setup();

    let clicked = 0;
    render(
        <PackageContextProvider>
            <ToolButton label="Button Label" icon={getIcon()} onClick={() => ++clicked} />
        </PackageContextProvider>
    );

    const button = screen.getByLabelText("Button Label");
    await user.click(button);
    expect(clicked).toBe(1);
});

it("allows configuration of additional button props", async () => {
    render(
        <PackageContextProvider>
            <ToolButton
                label="Button Label"
                icon={getIcon()}
                buttonProps={{
                    title: "foo"
                }}
            />
        </PackageContextProvider>
    );

    const button = screen.getByLabelText("Button Label");
    expect(button.title).toBe("foo");
});

it("automatically sets the 'aria-pressed' attribute when active", async () => {
    const getUI = (isActive: boolean | undefined) => (
        <PackageContextProvider>
            <ToolButton label="Button Label" icon={getIcon()} isActive={isActive} />
        </PackageContextProvider>
    );

    const { rerender } = render(getUI(false));

    // isActive=false -> aria-pressed=false
    const button = screen.getByLabelText("Button Label");
    expect(button.getAttribute("aria-pressed")).toBe("false");

    // isActive=true -> aria-pressed=true
    rerender(getUI(true));
    expect(button.getAttribute("aria-pressed")).toBe("true");

    // isActive=undefined -> aria-pressed not set
    rerender(getUI(undefined));
    expect(button.getAttribute("aria-pressed")).toBe(null);
});

it("shows a tooltip when hovered", async () => {
    const user = userEvent.setup();
    render(
        <PackageContextProvider>
            <ToolButton
                label="Button Label"
                icon={getIcon()}
                tooltipProps={{
                    openDelay: 0
                }}
            />
        </PackageContextProvider>
    );

    const button = screen.getByLabelText("Button Label");
    await user.hover(button);

    const tooltips = screen.getAllByRole("tooltip");
    expect(tooltips).toHaveLength(1);

    const tooltip = tooltips[0]!;
    expect(tooltip.textContent).toEqual("Button Label");

    // Does NOT set aria-describedby on the button (that would be the Tooltip's default behavior)
    // because we already have an aria-label with the same content.
    expect(button.getAttribute("aria-describedby")).toBe(null);
    expect(button.getAttribute("aria-labelledby")).toBe(null);
    expect(button.getAttribute("aria-label")).toBe("Button Label");
});

it("makes the button element available via 'ref'", async () => {
    const ref = createRef<HTMLButtonElement>();
    render(
        <PackageContextProvider>
            <ToolButton
                ref={ref}
                label="Button Label"
                icon={getIcon()}
                tooltipProps={{
                    openDelay: 0
                }}
            />
        </PackageContextProvider>
    );

    const button = screen.getByLabelText("Button Label");
    expect(ref.current).toBe(button);
});

function getIcon() {
    return <span>X</span>;
}
