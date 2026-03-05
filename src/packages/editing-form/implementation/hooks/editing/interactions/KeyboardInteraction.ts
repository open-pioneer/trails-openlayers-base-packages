// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BaseInteraction } from "../base/BaseInteraction";
import type { DrawingActions } from "../../../../api/model/DrawingState";

export class KeyboardInteraction extends BaseInteraction<KeyboardParameters, KeyboardData> {
    protected override startInteraction({ actions }: KeyboardParameters): KeyboardData {
        const keyboardListener = this.addKeyboardListener([
            { key: "Enter", action: () => actions.finish() },
            { key: "Escape", action: () => actions.reset() },
            { key: "Z", ctrlKey: true, action: () => actions.undo() },
            { key: "Z", ctrlKey: true, shiftKey: true, action: () => actions.redo() },
            { key: "Y", ctrlKey: true, action: () => actions.redo() }
        ]);
        return { keyboardListener };
    }

    protected override stopInteraction({ keyboardListener }: KeyboardData): void {
        document.removeEventListener("keydown", keyboardListener);
    }

    private addKeyboardListener(shortcuts: KeyboardShortcut[]) {
        const isApple = this.isApplePlatform();
        const listener: KeyboardListener = (event) => {
            const shortcut = shortcuts.find((shortcut) =>
                this.matchesShortcut(event, shortcut, isApple)
            );
            if (shortcut != null) {
                event.preventDefault();
                shortcut.action();
            }
        };
        document.addEventListener("keydown", listener);
        return listener;
    }

    private matchesShortcut(
        event: KeyboardEvent,
        shortcut: KeyboardShortcut,
        isApple: boolean
    ): boolean {
        if (isApple) {
            // On Apple platforms, the Command key is represented by 'metaKey'.
            return (
                event.key.toLowerCase() === shortcut.key.toLowerCase() &&
                event.metaKey === (shortcut.ctrlKey ?? false) &&
                event.shiftKey === (shortcut.shiftKey ?? false) &&
                !event.ctrlKey &&
                !event.altKey
            );
        } else {
            return (
                event.key.toLowerCase() === shortcut.key.toLowerCase() &&
                event.ctrlKey === (shortcut.ctrlKey ?? false) &&
                event.shiftKey === (shortcut.shiftKey ?? false) &&
                !event.metaKey &&
                !event.altKey
            );
        }
    }

    private isApplePlatform(): boolean {
        const platform = this.getPlatform();
        return platform != null && KeyboardInteraction.APPLE_REGEX.test(platform);
    }

    private getPlatform(): string | undefined {
        const platform = (navigator as NewNavigator).userAgentData?.platform;
        if (platform != null) {
            return platform;
        } else {
            return navigator.platform;
        }
    }

    private static readonly APPLE_REGEX = /(Mac|iPad|iPhone|iPod)/i;
}

interface KeyboardParameters {
    readonly actions: DrawingActions;
}

interface KeyboardData {
    readonly keyboardListener: KeyboardListener;
}

type KeyboardListener = Parameters<typeof document.addEventListener<"keydown">>[1];

interface KeyboardShortcut {
    readonly key: string;
    readonly ctrlKey?: boolean;
    readonly shiftKey?: boolean;
    readonly action: () => void;
}

interface NewNavigator extends Navigator {
    readonly userAgentData?: {
        readonly platform: string | undefined;
    };
}
