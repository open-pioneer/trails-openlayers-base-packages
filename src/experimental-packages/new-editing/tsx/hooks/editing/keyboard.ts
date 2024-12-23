// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { VoidCallback } from "../../types/types";

export function addKeyboardListener(shortcuts: KeyboardShortcut[]) {
    const isApple = isApplePlatform();
    const listener: KeyboardListener = (event) => {
        const shortcut = shortcuts.find((shortcut) => matchesShortcut(event, shortcut, isApple));
        if (shortcut != null) {
            event.preventDefault();
            shortcut.action();
        }
    };
    document.addEventListener("keydown", listener);
    return listener;
}

export function removeKeyboardListener(listener: KeyboardListener) {
    document.removeEventListener("keydown", listener);
}

function matchesShortcut(
    event: KeyboardEvent,
    shortcut: KeyboardShortcut,
    isApple: boolean
): boolean {
    const isMatch =
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        event.altKey === (shortcut.altKey ?? false) &&
        event.shiftKey === (shortcut.shiftKey ?? false);

    if (isApple) {
        // On Apple platforms, the Command key is represented by 'metaKey'.
        return (
            isMatch &&
            event.metaKey === (shortcut.ctrlKey ?? false) &&
            event.ctrlKey === (shortcut.metaKey ?? false)
        );
    } else {
        return (
            isMatch &&
            event.ctrlKey === (shortcut.ctrlKey ?? false) &&
            event.metaKey === (shortcut.metaKey ?? false)
        );
    }
}

function isApplePlatform(): boolean {
    const platform = getPlatform();
    if (platform != null) {
        return /(Mac|iPhone|iPod|iPad)/i.test(platform);
    } else {
        return false;
    }
}

function getPlatform(): string | undefined {
    const platform = (navigator as NewNavigator).userAgentData?.platform;
    if (platform != null) {
        return platform;
    } else {
        return navigator.platform;
    }
}

interface KeyboardShortcut {
    readonly key: string;
    readonly ctrlKey?: boolean;
    readonly shiftKey?: boolean;
    readonly altKey?: boolean;
    readonly metaKey?: boolean;
    readonly action: VoidCallback;
}

interface NewNavigator extends Navigator {
    readonly userAgentData?: {
        readonly platform: string | undefined;
    };
}

type KeyboardListener = Parameters<typeof document.addEventListener<"keydown">>[1];
