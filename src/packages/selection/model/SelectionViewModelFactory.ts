// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { ReadonlyReactive } from "@conterra/reactivity-core";
import { MapModel } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import { FormattedMessage } from "@open-pioneer/react-utils";
import { DECLARE_SERVICE_INTERFACE, PackageIntl, ServiceOptions } from "@open-pioneer/runtime";
import { createElement } from "react";
import { SelectionResult, SelectionSource } from "../api";
import { Messages, SelectionViewModel } from "./SelectionViewModel";

interface References {
    notifier: NotificationService;
}

/**
 * @internal
 */
export class SelectionViewModelFactory {
    declare [DECLARE_SERVICE_INTERFACE]: "selection.ViewModelFactory";

    #notifier: NotificationService;
    #currentIntl: ReadonlyReactive<PackageIntl>;
    #messages: Messages;

    constructor({ references, currentIntl }: ServiceOptions<References>) {
        this.#notifier = references.notifier;
        this.#currentIntl = currentIntl;
        this.#messages = {
            get active() {
                return currentIntl.value.formatMessage({ id: "tooltip" });
            },
            get inactive() {
                return currentIntl.value.formatMessage({ id: "disabledTooltip" });
            },
            get noSource() {
                return currentIntl.value.formatMessage({ id: "noSourceTooltip" });
            }
        };
    }

    createViewModel(options: {
        map: MapModel;
        onComplete: (source: SelectionSource, results: SelectionResult[]) => void;
    }): SelectionViewModel {
        return new SelectionViewModel({
            map: options.map,
            messages: this.#messages,
            onComplete: options.onComplete,
            onError: () => {
                this.#notifier.notify({
                    level: "error",
                    message: createElement(FormattedMessage, {
                        intl: this.#currentIntl,
                        id: "selectionFailed"
                    })
                });
            }
        });
    }
}
