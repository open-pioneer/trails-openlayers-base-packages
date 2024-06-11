// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Select } from "@open-pioneer/chakra-integration";
import { createLogger } from "@open-pioneer/core";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";
import { useMemo } from "react";
import { AppModel } from "../../model/AppModel";
import { HeaderFormControl } from "./HeaderFormControl";

const LOG = createLogger("app::DemoSelection");

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
            <Select
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
            </Select>
        </HeaderFormControl>
    );
}
