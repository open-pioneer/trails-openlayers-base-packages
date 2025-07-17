// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { rolldown } from "rolldown";
import { dts } from "rolldown-plugin-dts";

async function main() {
    const result = await rolldown({
        plugins: [
            {
                name: "blub",
                resolveId(id) {
                    if (id.includes("?")) {
                        return false; // external
                    }
                }
            },
            dts({
                emitDtsOnly: true,
                isolatedDeclarations: true
            })
        ],
        input: ["index.ts"],
        external: /\/node_modules\//
    });
    await result.write({
        dir: "dist",
        preserveModules: true
    });
}

main();
