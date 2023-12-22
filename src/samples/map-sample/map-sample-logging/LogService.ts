// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { DeclaredService, Service, ServiceOptions } from "@open-pioneer/runtime";

export interface Logger extends DeclaredService<"map-sample-logging.LogService"> {
    log(message: string): void;
}

/**
 * Example service that simply logs to the console.
 * NOTE: use the logger from @open-pioneer/core in production!
 */
export class LogService implements Service<Logger> {
    constructor({ properties }: ServiceOptions) {
        const logLevel = properties.logLevel as string;
        console.debug("Log Service created with log level", logLevel);
    }

    destroy() {
        console.debug("Log Service destroyed");
    }

    log(msg: string) {
        console.info("LOG: " + msg);
    }
}

export interface LoggingProperties {
    /** Log level for the shared logger. */
    logLevel: "DEBUG" | "INFO" | "ERROR";
}
