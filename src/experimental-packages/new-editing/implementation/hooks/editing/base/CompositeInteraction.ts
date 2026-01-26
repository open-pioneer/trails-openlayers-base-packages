// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { EditingInteraction } from "./EditingInteraction";

export class CompositeInteraction implements EditingInteraction {
    constructor(private readonly interactions: EditingInteraction[]) {}

    start(): void {
        for (const interaction of this.interactions) {
            interaction.start();
        }
    }

    stop(): void {
        for (const interaction of this.interactions) {
            interaction.stop();
        }
    }
}
