// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { NativeSelectField, NativeSelectRoot } from "@open-pioneer/chakra-snippets/native-select";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { LocaleService, parseLocale } from "@open-pioneer/runtime";
import { useIntl, useProperties, useService } from "open-pioneer:react-hooks";
import { useEffect } from "react";
import { HeaderFormControl } from "./HeaderFormControl";

/**
 * Implements a simple widget to change the application's locale.
 *
 * NOTE: Expects that the app supports both "en" and "de" locales.
 */
export function LocaleSwitcher() {
    useGlobalLang();
    const intl = useIntl();
    const localeService = useService<LocaleService>("runtime.LocaleService");

    const currentLocale = getLocale(localeService.messageLocale.language);
    const changeLocale = (locale: string) => {
        localeService.changeLocale(parseLocale(locale));
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

function getLocale(language: string) {
    if (language === "en" || language == "de") {
        return language;
    }
    throw new Error("unexpected language: " + language);
}

/**
 * Syncs the application's locale into the <html> element.
 *
 * This is appropriate when the app implements the entire page anyway; it may introduce
 * conflicts when the app is embedded into another site.
 */
function useGlobalLang() {
    const localeService = useService<LocaleService>("runtime.LocaleService");
    const embedded = !!useProperties().embedded;
    const locale = useReactiveSnapshot(() => localeService.locale.baseName, [localeService]);
    useEffect(() => {
        if (!embedded) {
            document.documentElement.lang = locale;
        }
    }, [embedded, locale]);
}
