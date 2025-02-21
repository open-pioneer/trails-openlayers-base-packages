// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent } from "@testing-library/react";

export function showDropdown(projSelect: HTMLElement) {
    // open dropdown to include options in snapshot; react-select creates list of options in dom after opening selection
    act(() => {
        fireEvent.keyDown(projSelect, { key: "ArrowDown" });
    });
}

export function getCurrentOptions() {
    return Array.from(
        document.getElementsByClassName("coordinate-input-select__option")
    ) as HTMLElement[];
}

export function getCurrentOptionValues(options: HTMLElement[]) {
    const values: (string | null)[] = [];
    for (const opt of options) {
        values.push(opt.textContent);
    }
    return values;
}

export function getClearButton(coordinateSearchGroup: Element) {
    const buttonDiv = coordinateSearchGroup.querySelector(".chakra-input__right-element");
    if (!buttonDiv) {
        throw new Error("buttons not rendered");
    }
    const clearButton = buttonDiv.querySelector(".coordinate-input-clear-button");
    if (!clearButton) {
        throw new Error("clear button not rendered");
    }
    return clearButton;
}

export function getCopyButton(coordinateSearchGroup: Element) {
    const buttonDiv = coordinateSearchGroup.querySelector(".chakra-input__right-element");
    if (!buttonDiv) {
        throw new Error("buttons not rendered");
    }
    const copyButton = buttonDiv.querySelector(".coordinate-input-copy-button");
    if (!copyButton) {
        throw new Error("copy button not rendered");
    }
    return copyButton;
}
