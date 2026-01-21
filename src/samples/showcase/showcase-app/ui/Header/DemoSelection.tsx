// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { NativeSelectField, NativeSelectRoot } from "@open-pioneer/chakra-snippets/native-select";
import { createLogger } from "@open-pioneer/core";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";
import { sourceId } from "open-pioneer:source-info";
import { useMemo } from "react";
import { AppModel } from "../../model/AppModel";
import { HeaderFormControl } from "./HeaderFormControl";

const LOG = createLogger(sourceId);

export interface DemoSelectionProps {
    appModel: AppModel;
}

export function DemoSelection({ appModel }: DemoSelectionProps) {
    const intl = useIntl();
    const { allDemos, currentDemo } = useReactiveSnapshot(
        () => ({
            allDemos: appModel.allDemoInfos,
            currentDemo: appModel.currentDemo
        }),
        [appModel]
    );

    const options = useMemo(() => {
        return allDemos.map((demo) => (
            <option key={demo.id} value={demo.id}>
                {demo.title}
            </option>
        ));
    }, [allDemos]);

    return (
        <HeaderFormControl label={intl.formatMessage({ id: "demoSelection.label" })}>
            <NativeSelectRoot>
                <NativeSelectField
                    value={currentDemo.id}
                    onChange={(e) => {
                        const demoId = e.target.value;
                        try {
                            appModel.selectDemo(demoId);
                        } catch (e) {
                            LOG.error("Failed to select demo", e);
                        }
                    }}
                >
                    {options}
                </NativeSelectField>
            </NativeSelectRoot>
        </HeaderFormControl>
    );
}
