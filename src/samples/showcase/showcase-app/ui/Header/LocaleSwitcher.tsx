// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { NativeSelectField, NativeSelectRoot } from "@open-pioneer/chakra-snippets/native-select";
import { ApplicationContext } from "@open-pioneer/runtime";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { HeaderFormControl } from "./HeaderFormControl";

/**
 * Implements a simple widget to change the application's locale.
 *
 * NOTE: Expects that the app supports both "en" and "de" locales.
 */
export function LocaleSwitcher() {
    const intl = useIntl();
    const appCtx = useService<ApplicationContext>("runtime.ApplicationContext");

    const currentLocale = parseLocale(appCtx.getLocale());
    const changeLocale = (locale: string) => {
        switch (locale) {
            case "en":
                appCtx.setLocale("en-GB");
                break;
            case "de":
                appCtx.setLocale("de-DE");
                break;
        }
    };

    return (
        <HeaderFormControl label={intl.formatMessage({ id: "localeSwitcher.label" })}>
            <NativeSelectRoot>
                <NativeSelectField
                    value={currentLocale}
                    onChange={(e) => changeLocale(e.target.value)}
                >
                    <option value="de">
                        {intl.formatMessage({ id: `localeSwitcher.locale.de` })}
                    </option>
                    <option value="en">
                        {intl.formatMessage({ id: `localeSwitcher.locale.en` })}
                    </option>
                </NativeSelectField>
            </NativeSelectRoot>
        </HeaderFormControl>
    );
}

function parseLocale(locale: string) {
    const prefix = locale.match(/^[a-z]+/i)?.[0];
    if (prefix === "en" || prefix == "de") {
        return prefix;
    }
    throw new Error("unexpected locale prefix: " + prefix);
}
