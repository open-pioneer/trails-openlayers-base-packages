// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";

export function mockGeolocation() {
    vi.spyOn(navigator, "geolocation", "get").mockReturnValue({
        clearWatch() {},
        getCurrentPosition() {},
        watchPosition(success) {
            setTimeout(() => {
                success({
                    coords: {
                        latitude: 51.1,
                        longitude: 45.3,
                        accuracy: 2500,
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null
                    }
                } as GeolocationPosition);
            }, 1);

            return 123;
        }
    } satisfies Partial<Geolocation>);
}
