// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl } from "open-pioneer:react-hooks";
import { SelectionSource } from "../api";
import { getSourceStatus } from "../model";

export type SimpleStatus =
    | {
          kind: "available";
      }
    | {
          kind: "unavailable";
          reason: string;
      };

export function useSourceStatus(source: SelectionSource | undefined): SimpleStatus {
    const intl = useIntl();
    const sourceStatus = useReactiveSnapshot((): SimpleStatus => {
        if (!source) {
            return {
                kind: "unavailable",
                reason: intl.formatMessage({ id: "sourceNotAvailable" })
            };
        }

        const status = getSourceStatus(source);
        if (status.kind === "available") {
            return status;
        }
        return {
            kind: "unavailable",
            reason: status.reason ?? intl.formatMessage({ id: "sourceNotAvailable" })
        };
    }, [source, intl]);
    return sourceStatus;
}
