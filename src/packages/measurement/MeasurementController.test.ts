// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from "vitest";
import { createIntl, createIntlCache, IntlErrorCode } from "@formatjs/intl";
import { MeasurementController } from "./MeasurementController";
import OlMap from "ol/Map";
import { Interaction } from "ol/interaction";
import Draw from "ol/interaction/Draw";

it("should successfully start measurement, and activate or deactivate draw interaction", async () => {
    const selectedMeasurement = "distance";

    const olMap = new OlMap();
    const locale = "en";
    const defaultMessageLocale = "en";
    const cache = createIntlCache();
    const messages = {
        "tooltips.continue": "Click to continue drawing",
        "tooltips.help": "Click to start drawing"
    };
    const intl = createIntl(
        {
            locale,
            defaultLocale: defaultMessageLocale,
            messages,
            onError: (err) => {
                if (err.code === IntlErrorCode.MISSING_TRANSLATION) {
                    return;
                }
                console.error(err);
            }
        },
        cache
    );

    const controller = new MeasurementController(olMap, intl);

    controller.startMeasurement(selectedMeasurement);
    let drawActivated = drawInteractionActivated(olMap);
    expect(drawActivated).toBe(true);

    controller.stopMeasurement();
    drawActivated = drawInteractionActivated(olMap);
    expect(drawActivated).toBe(false);
});

function drawInteractionActivated(olMap: OlMap) {
    const interactions = olMap.getInteractions().getArray();
    const draw = interactions?.find((interaction: Interaction) => interaction instanceof Draw);
    return draw?.getActive() || false;
}
