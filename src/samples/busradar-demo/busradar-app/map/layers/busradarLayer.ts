// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import Feature, { type FeatureLike } from "ol/Feature";
import Point from "ol/geom/Point";
import { fromLonLat, toLonLat } from "ol/proj";
import { getDistance } from "ol/sphere";
import VectorSource from "ol/source/Vector";
import { Fill, Icon, Stroke, Style, Text } from "ol/style";
import { loadGtfsTripShapePath } from "../../api/busradarTripDetails";
import { classifyBusradarDelay } from "../../utils/busradarDelay";
import { SubpixelVectorLayer } from "./subpixelVectorLayer";

export const BUSRADAR_LAYER_ID = "busradar-live-busse-muenster";
export const BUSRADAR_LAYER_TITLE = "Live-Busse Münster";
export const BUSRADAR_DELAY_COLORS = {
    green: "#2f855a",
    yellow: "#d69e2e",
    red: "#c53030",
    gray: "#718096"
} as const;
export const BUSRADAR_ROUTE_STYLE_Z_INDEX = 20;
export const BUSRADAR_ROUTE_DIRECTION_STYLE_Z_INDEX = 21;
export const BUSRADAR_VEHICLE_STYLE_Z_INDEX = 30;
export const BUSRADAR_SELECTED_VEHICLE_STYLE_Z_INDEX = 40;

export type BusradarDelayStatus = {
    color: string;
    label: string;
    delay?: number;
};

const BUSRADAR_REST_URL = "https://rest.busradar.conterra.de/prod/fahrzeuge";
const BUSRADAR_TRIP_ROUTE_URL = "https://rest.busradar.conterra.de/prod/fahrten";
const BUSRADAR_WEBSOCKET_URL = "wss://websocket.busradar.conterra.de";
const RECONNECT_DELAY_MS = 5000;
const BUSRADAR_REST_REFRESH_MS = 15_000;
const BUS_PLAYBACK_DELAY_MS = 45_000;
const BUS_STALE_TIMEOUT_MS = 60_000;
const BUS_POSITION_MAX_AGE_MS = 180_000;
const BUS_POSITION_MAX_BUFFER_SIZE = 30;
const BUS_MAX_INTERPOLATION_GAP_MS = 120_000;
const BUS_MAX_PLAUSIBLE_SPEED_MPS = 35;
const BUS_RECOVERY_TRANSITION_MS = 6000;
const API_TIMESTAMP_MAX_PAST_MS = 10 * 60 * 1000;
const API_TIMESTAMP_MAX_FUTURE_MS = 60 * 1000;
const ROUTE_MAX_SNAP_DISTANCE_M = 100;
// Cooldown, nach dem ein zuvor fehlgeschlagener Routenabruf erneut versucht werden darf. So kann
// ein später wieder verfügbarer API-LineString (oder GTFS-Fallback) genutzt werden, ohne pro
// Fahrzeug-Ingest unnötig oft neu zu laden.
const TRIP_ROUTE_RETRY_TTL_MS = 60_000;
const ROUTE_BACKTRACK_TOLERANCE_M = 30;
const ROUTE_ROTATION_SAMPLE_DISTANCE_M = 10;
const BUS_ROTATION_SMOOTHING = 0.38;
const BUS_ROTATION_MIN_DISTANCE_SQUARED = 4;
const BUSRADAR_DEBUG = false;
const BUSRADAR_DEBUG_BUS_LIMIT = 3;
const BUSRADAR_SELECTED_PROPERTY = "busradarSelected";
const BUSRADAR_LINE_VISIBLE_PROPERTY = "busradarLineVisible";
const BUSRADAR_ROTATION_PROPERTY = "busradarRotation";
const BUSRADAR_ICON_FACING_PROPERTY = "busradarIconFacing";
const BUSRADAR_STYLE_PROPERTY = "busradarStyle";
const BUSRADAR_STYLE_KEY_PROPERTY = "busradarStyleKey";
const BUSRADAR_ICON_ANCHOR: [number, number] = [0.5, 0.5];
const BUSRADAR_ICON_SCALE = 0.47;
const BUSRADAR_SELECTED_ICON_SCALE = 0.57;
// Zoomabhängige, kontinuierlich begrenzte Skalierung der Bus-Symbole: Herauszoomen verkleinert,
// Hineinzoomen vergrößert sie leicht. Faktor 1.0 liegt auf dem Referenz-Zoom; die Klammerung hält
// die Symbole weder zu klein noch zu dominant.
const BUSRADAR_ICON_SCALE_REFERENCE_ZOOM = 16;
const BUSRADAR_ICON_SCALE_PER_ZOOM = 0.09;
const BUSRADAR_ICON_SCALE_MIN_FACTOR = 0.65;
const BUSRADAR_ICON_SCALE_MAX_FACTOR = 1.35;
const WEB_MERCATOR_MAX_RESOLUTION = 156543.03392804097;
const BUS_LABEL_MIN_ZOOM_LINE = 14;
const BUS_LABEL_MIN_ZOOM_DIRECTION = 16;
const BUS_LABEL_DIRECTION_MAX_LENGTH = 24;

// Delay-Farbschwellen (Sekunden). Die fachliche Pünktlich-Toleranz und die Minuten-Klassifizierung
// liegen zentral in utils/busradarDelay.ts; hier nur die farbspezifischen Kategorien-Grenzen.
// Drei Kategorien: grün „Pünktlich", gelb „Bis 4 Min. verspätet", rot „Mehr als 4 Min. verspätet".
const BUSRADAR_DELAY_YELLOW_MIN_S = 60; // ab 60 s Verspätung → gelb („Bis 4 Min.")
const BUSRADAR_DELAY_RED_MIN_EXCLUSIVE_S = 240; // mehr als 240 s (>4 Min.) → rot; 240 s selbst bleibt gelb

// Fachliche Chrome-Farben/Typografie des Bus-Labels (Datenlabel, bewusst zentral definiert).
const BUSRADAR_LABEL_TEXT_FONT = "700 13px system-ui, sans-serif";
const BUSRADAR_LABEL_LINE_FONT = "800 13px system-ui, sans-serif";
const BUSRADAR_LABEL_DIRECTION_FONT = "500 12px system-ui, sans-serif";
const BUSRADAR_LABEL_TEXT_COLOR = "#0f172a";
const BUSRADAR_LABEL_HALO_COLOR = "rgba(255, 255, 255, 0.72)";
const BUSRADAR_LABEL_HALO_WIDTH = 2;
const BUSRADAR_LABEL_BACKGROUND_COLOR = "rgba(255, 255, 255, 0.86)";
const BUSRADAR_LABEL_BACKGROUND_STROKE_COLOR = "rgba(15, 23, 42, 0.1)";
const BUSRADAR_LABEL_BACKGROUND_STROKE_WIDTH = 1;
const BUSRADAR_LABEL_OFFSET_Y_SELECTED = -29;
const BUSRADAR_LABEL_OFFSET_Y_DEFAULT = -26;
const BUSRADAR_LABEL_PADDING: [number, number, number, number] = [2, 6, 2, 6];

type BusradarBusIconFacing = "right" | "left";

type BusradarFeatureCollection = {
    features?: BusradarFeature[];
};

type BusradarFeature = {
    geometry?: {
        coordinates?: [number, number];
    };
    properties?: BusradarProperties;
};

type BusradarTripRouteFeature = {
    geometry?: {
        type?: string;
        coordinates?: [number, number][];
    };
    properties?: BusradarProperties;
};

export type BusradarProperties = {
    operation?: string;
    fahrzeugid?: string;
    fahrtbezeichner?: string;
    linientext?: string;
    richtungstext?: string;
    delay?: number;
    visfahrplanlagezst?: number;
    sequenz?: number | string;
    starthst?: string;
    zielhst?: string;
    fpl_id?: string;
    line_id?: string;
    startzeit?: number;
    endzeit?: number;
};

type BufferedVehiclePosition = {
    mapCoordinate: [number, number];
    lonLatCoordinate: [number, number];
    timestamp: number;
    receivedAt: number;
};

type VehiclePlaybackState = {
    id: string;
    feature: Feature<Point>;
    displayedCoordinate: [number, number];
    bufferedPositions: BufferedVehiclePosition[];
    lastUpdateReceivedAt: number;
    hasVisiblePosition: boolean;
    waitingForNextTimelinePoint: boolean;
    recovery?: VisualRecovery;
    debugStatus?: VehiclePlaybackStatus;
    underflowCount: number;
    resetCount: number;
    displayedRotation?: number;
    displayedIconFacing?: BusradarBusIconFacing;
    routeSegmentProjection?: RouteSegmentProjectionCache;
};

type VisualRecovery = {
    fromCoordinate: [number, number];
    startedAt: number;
    duration: number;
};

/**
 * Zwischenspeicher der Routen-Projektionen des aktuell interpolierten Segments. Die Projektionen
 * der beiden begrenzenden Buffer-Positionen hängen nur von diesen Positionen und der Route ab und
 * ändern sich daher nur bei einem Segmentwechsel. Die Identität wird über die Objektreferenzen der
 * Positionen und der Route geprüft; jede Timeline-Änderung (neue/ersetzte Position, Reset) erzeugt
 * neue Referenzen und damit automatisch einen Cache-Miss. So entfällt die redundante Neuprojektion
 * pro Frame, ohne das Bewegungsergebnis zu verändern.
 */
type RouteSegmentProjectionCache = {
    startPosition: BufferedVehiclePosition;
    endPosition: BufferedVehiclePosition;
    route: BusradarTripRoute;
    startProjection: BusradarRouteProjection | undefined;
    endProjection: BusradarRouteProjection | undefined;
};

type VehiclePlaybackStatus = "waiting" | "holding" | "interpolating" | "underflow" | "recovering";

type TimelineFitResult =
    | { ok: true }
    | {
          ok: false;
          reason: "gap" | "speed" | "time";
          timeDeltaMs: number;
          speedMetersPerSecond?: number;
      };

type PlaybackCoordinateResult = {
    coordinate: [number, number];
    status: VehiclePlaybackStatus;
    rotation?: number;
    startPosition?: BufferedVehiclePosition;
    endPosition?: BufferedVehiclePosition;
    progress?: number;
};

type RoutePlaybackResult = {
    coordinate: [number, number];
    rotation: number;
    distanceAlongRoute: number;
};

export type BusradarTripRoute = {
    id: string;
    lonLatCoordinates: [number, number][];
    mapCoordinates: [number, number][];
    cumulativeDistances: number[];
    lengthMeters: number;
    properties: BusradarProperties;
};

type TripRouteCacheEntry =
    | { status: "loading"; promise: Promise<BusradarTripRoute | undefined> }
    | { status: "loaded"; route: BusradarTripRoute }
    | { status: "failed"; failedAt: number };

type TripRouteCache = Map<string, TripRouteCacheEntry>;

export type BusradarRouteProjection = {
    distanceAlongRoute: number;
    snapDistanceMeters: number;
};

export type BusradarSelectedVehicle = {
    id: string;
    coordinate: [number, number];
    properties: BusradarProperties;
};

export type BusradarVehicleUpdateListener = (vehicle: BusradarSelectedVehicle | undefined) => void;
export type BusradarAvailableLinesListener = (lines: string[]) => void;

export type BusradarRouteSplit = {
    route: BusradarTripRoute;
    passedCoordinates: [number, number][];
    upcomingCoordinates: [number, number][];
    projection?: BusradarRouteProjection;
};

export type BusradarControllerApi = {
    getSelectedVehicle(feature: FeatureLike): BusradarSelectedVehicle | undefined;
    getVehicleById(id: string): BusradarSelectedVehicle | undefined;
    subscribeToVehicleUpdates(id: string, listener: BusradarVehicleUpdateListener): () => void;
    subscribeToAvailableLines(listener: BusradarAvailableLinesListener): () => void;
    setSelectedVehicleId(id: string | undefined): void;
    setLineFilter(lines: string[]): void;
    getAvailableLines(): string[];
    getLineFilter(): string[];
    getTripRoute(tripId: string): Promise<BusradarTripRoute | undefined>;
    getRouteSplit(tripId: string, coordinate: [number, number]): BusradarRouteSplit | undefined;
};

export const BUSRADAR_CONTROLLER_PROPERTY = "busradarController";

const debugVehicleIds = new Set<string>();

export function createBusradarLayer() {
    const source = new VectorSource();
    const controller = createBusradarController(source);
    // Subpixel-Renderer für die Bus-Fahrzeuge: unterdrückt OpenLayers' Ganzpixel-Snapping nur für
    // diesen Layer, damit sich bewegende Busse flüssig (subpixelgenau) statt pixelweise gerendert
    // werden. Feature-Koordinaten/Interpolation/Rotation/Labels bleiben unverändert.
    const layer = new SubpixelVectorLayer({
        source,
        visible: false,
        style: (feature, resolution) => createVehicleStyle(feature, resolution),
        // Zeichenreihenfolge bei Überlappung innerhalb derselben Style-zIndex-Gruppe: der auf dem
        // Bildschirm weiter unten liegende Bus wird zuletzt gezeichnet und damit über dem weiter
        // oben liegenden dargestellt. Da der ausgewählte Bus einen höheren Style-zIndex (40) als
        // normale Busse (30) hat, wirkt renderOrder nur unter den normalen Bussen und kann die
        // Auswahl nie überstimmen. Nur Zeichenreihenfolge – keine Positions-/Offset-Änderung.
        renderOrder: compareBusradarRenderOrder,
        properties: {
            title: BUSRADAR_LAYER_TITLE
        }
    });
    layer.set(BUSRADAR_CONTROLLER_PROPERTY, controller.api);

    layer.on("change:visible", () => {
        if (layer.getVisible()) {
            controller.start();
        } else {
            controller.stop();
        }
    });

    return layer;
}

/**
 * `renderOrder`-Comparator für den Bus-Layer. Sortiert Features innerhalb derselben
 * Style-zIndex-Gruppe so, dass der auf dem Bildschirm weiter unten liegende Bus zuletzt gezeichnet
 * (und damit oben dargestellt) wird. Bildschirm-Y wächst nach unten, EPSG:3857-Karten-Y nach oben;
 * „weiter unten" entspricht also dem kleineren Karten-Y. Reine Zeichenreihenfolge – keine
 * Positions-/Offset-Änderung. Die Auswahl bleibt unberührt, weil sie über einen höheren
 * Style-zIndex läuft und renderOrder nur innerhalb einer zIndex-Gruppe wirkt.
 */
export function compareBusradarRenderOrder(first: FeatureLike, second: FeatureLike): number {
    // Kleineres Y (südlich, bildschirmunten) soll später gezeichnet werden → positiver Wert sortiert
    // es nach hinten in die Zeichenliste.
    return getBusradarFeatureY(second) - getBusradarFeatureY(first);
}

function getBusradarFeatureY(feature: FeatureLike): number {
    const geometry = feature.getGeometry();
    if (geometry instanceof Point) {
        return geometry.getCoordinates()[1] ?? 0;
    }
    return 0;
}

function createBusradarController(source: VectorSource) {
    let isActive = false;
    let websocket: WebSocket | undefined;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
    let restRefreshInterval: ReturnType<typeof setInterval> | undefined;
    let abortController: AbortController | undefined;
    let animationFrame: number | undefined;
    const vehicleStates = new Map<string, VehiclePlaybackState>();
    const tripRouteCache: TripRouteCache = new Map();
    const vehicleUpdateListeners = new Map<string, Set<BusradarVehicleUpdateListener>>();
    const availableLinesListeners = new Set<BusradarAvailableLinesListener>();
    let availableLines: string[] = [];
    let selectedLineFilter = new Set<string>();
    let selectedVehicleId: string | undefined;

    function start() {
        if (isActive) {
            return;
        }

        isActive = true;
        schedulePlaybackFrame();
        void loadCurrentVehicles();
        restRefreshInterval = setInterval(() => {
            void loadCurrentVehicles();
        }, BUSRADAR_REST_REFRESH_MS);
        connectWebsocket();
    }

    function stop() {
        isActive = false;
        source.clear();
        notifyAllVehicleRemoved(vehicleUpdateListeners);
        vehicleStates.clear();
        availableLines = [];
        selectedLineFilter = new Set();
        notifyAvailableLines(availableLinesListeners, availableLines);
        selectedVehicleId = undefined;
        abortController?.abort();
        abortController = undefined;

        if (animationFrame !== undefined) {
            cancelAnimationFrame(animationFrame);
            animationFrame = undefined;
        }

        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = undefined;
        }

        if (restRefreshInterval) {
            clearInterval(restRefreshInterval);
            restRefreshInterval = undefined;
        }

        if (websocket) {
            websocket.onclose = null;
            websocket.onerror = null;
            websocket.onmessage = null;
            websocket.close();
            websocket = undefined;
        }
    }

    // Gemeinsame Verarbeitung einer Fahrzeug-Collection aus REST-Snapshot und WebSocket:
    // Fahrzeuge/Playback aktualisieren und die verfügbaren Linien neu berechnen.
    function ingestVehicleCollection(collection: BusradarFeatureCollection) {
        applyVehicleCollection(
            collection,
            source,
            vehicleStates,
            tripRouteCache,
            vehicleUpdateListeners,
            selectedLineFilter
        );
        availableLines = updateAvailableLines(
            vehicleStates,
            availableLines,
            availableLinesListeners
        );
    }

    async function loadCurrentVehicles() {
        abortController?.abort();
        abortController = new AbortController();

        try {
            const response = await fetch(BUSRADAR_REST_URL, { signal: abortController.signal });
            if (!response.ok) {
                throw new Error(
                    `Busradar-Snapshot konnte nicht geladen werden: ${response.status}`
                );
            }

            ingestVehicleCollection((await response.json()) as BusradarFeatureCollection);
        } catch (error) {
            if ((error as Error).name !== "AbortError") {
                console.error("Busradar-Snapshot konnte nicht geladen werden.", error);
            }
        }
    }

    function connectWebsocket() {
        if (!isActive || websocket) {
            return;
        }

        websocket = new WebSocket(BUSRADAR_WEBSOCKET_URL);
        websocket.onmessage = (event) => {
            try {
                ingestVehicleCollection(
                    JSON.parse(String(event.data)) as BusradarFeatureCollection
                );
            } catch (error) {
                console.error(
                    "Busradar-WebSocket-Nachricht konnte nicht verarbeitet werden.",
                    error
                );
            }
        };
        websocket.onerror = () => {
            reconnect();
        };
        websocket.onclose = () => {
            reconnect();
        };
    }

    function reconnect() {
        websocket = undefined;

        if (!isActive || reconnectTimeout) {
            return;
        }

        reconnectTimeout = setTimeout(() => {
            reconnectTimeout = undefined;
            connectWebsocket();
        }, RECONNECT_DELAY_MS);
    }

    function schedulePlaybackFrame() {
        if (!isActive || animationFrame !== undefined) {
            return;
        }

        animationFrame = requestAnimationFrame(updatePlayback);
    }

    function updatePlayback() {
        animationFrame = undefined;

        if (!isActive) {
            return;
        }

        const now = Date.now();
        const playbackTime = now - BUS_PLAYBACK_DELAY_MS;

        for (const state of Array.from(vehicleStates.values())) {
            if (now - state.lastUpdateReceivedAt > BUS_STALE_TIMEOUT_MS) {
                removeVehicleState(source, vehicleStates, state, vehicleUpdateListeners);
                continue;
            }

            updateVehiclePlaybackPosition(state, playbackTime, tripRouteCache);
            cleanupVehicleBuffer(state, playbackTime);
            notifyVehicleUpdate(
                vehicleUpdateListeners,
                state.id,
                getSelectedVehicleFromState(state)
            );
        }

        schedulePlaybackFrame();
    }

    const api: BusradarControllerApi = {
        getSelectedVehicle(feature) {
            if (feature.get(BUSRADAR_LINE_VISIBLE_PROPERTY) === false) {
                return undefined;
            }
            const id = String(feature.getId() ?? "");
            const state = vehicleStates.get(id);
            return state ? getSelectedVehicleFromState(state) : undefined;
        },
        getVehicleById(id) {
            const state = vehicleStates.get(id);
            return state ? getSelectedVehicleFromState(state) : undefined;
        },
        subscribeToVehicleUpdates(id, listener) {
            const listeners =
                vehicleUpdateListeners.get(id) ?? new Set<BusradarVehicleUpdateListener>();
            listeners.add(listener);
            vehicleUpdateListeners.set(id, listeners);

            const state = vehicleStates.get(id);
            listener(state ? getSelectedVehicleFromState(state) : undefined);

            return () => {
                listeners.delete(listener);
                if (listeners.size === 0) {
                    vehicleUpdateListeners.delete(id);
                }
            };
        },
        subscribeToAvailableLines(listener) {
            availableLinesListeners.add(listener);
            listener(availableLines);

            return () => {
                availableLinesListeners.delete(listener);
            };
        },
        setSelectedVehicleId(id) {
            setSelectedVehicleState(vehicleStates, selectedVehicleId, false);
            selectedVehicleId = id;
            setSelectedVehicleState(vehicleStates, selectedVehicleId, true);
        },
        setLineFilter(lines) {
            selectedLineFilter = new Set(lines.map(normalizeLineFilterValue).filter(Boolean));
            applyLineFilter(vehicleStates, selectedLineFilter);
        },
        getAvailableLines() {
            return availableLines;
        },
        getLineFilter() {
            return Array.from(selectedLineFilter);
        },
        getTripRoute(tripId) {
            return getTripRoute(tripId, tripRouteCache);
        },
        getRouteSplit(tripId, coordinate) {
            const entry = tripRouteCache.get(tripId);
            if (entry?.status !== "loaded") {
                return undefined;
            }

            const projection = projectCoordinateOnRoute(entry.route, coordinate);
            if (!projection || projection.snapDistanceMeters > ROUTE_MAX_SNAP_DISTANCE_M) {
                return {
                    route: entry.route,
                    passedCoordinates: [],
                    upcomingCoordinates: entry.route.mapCoordinates
                };
            }

            return splitRouteAtDistance(entry.route, projection.distanceAlongRoute, projection);
        }
    };

    return { start, stop, api };
}

function applyVehicleCollection(
    collection: BusradarFeatureCollection,
    source: VectorSource,
    vehicleStates: Map<string, VehiclePlaybackState>,
    tripRouteCache: TripRouteCache,
    vehicleUpdateListeners: Map<string, Set<BusradarVehicleUpdateListener>>,
    selectedLineFilter: Set<string>
) {
    const receivedAt = Date.now();

    for (const vehicle of collection.features ?? []) {
        const properties = vehicle.properties;
        const id = getVehicleId(properties);

        if (!id) {
            continue;
        }

        if (properties?.fahrtbezeichner) {
            ensureTripRoute(properties.fahrtbezeichner, tripRouteCache);
        }

        const operation = properties?.operation?.toUpperCase();
        if (operation === "DELETE" || operation === "REMOVE") {
            removeVehicleFeature(
                source,
                vehicleStates,
                id,
                properties?.fahrtbezeichner,
                properties?.fahrzeugid,
                vehicleUpdateListeners
            );
            continue;
        }

        const coordinates = vehicle.geometry?.coordinates;
        if (!isValidCoordinate(coordinates)) {
            continue;
        }

        const mapCoordinate = fromLonLat(coordinates) as [number, number];
        const position: BufferedVehiclePosition = {
            mapCoordinate,
            lonLatCoordinate: coordinates,
            timestamp: getPositionTimestamp(properties, receivedAt),
            receivedAt
        };
        const existingState = vehicleStates.get(id);

        if (existingState) {
            existingState.feature.setProperties(properties ?? {});
            setFeatureLineVisibility(existingState.feature, selectedLineFilter);
            existingState.lastUpdateReceivedAt = receivedAt;
            addBufferedPosition(existingState, position);
        } else {
            const feature = new Feature({
                geometry: new Point(mapCoordinate),
                ...(properties ?? {})
            });
            feature.setId(id);
            setFeatureLineVisibility(feature, selectedLineFilter);
            source.addFeature(feature);

            vehicleStates.set(id, {
                id,
                feature,
                displayedCoordinate: mapCoordinate,
                bufferedPositions: [position],
                lastUpdateReceivedAt: receivedAt,
                hasVisiblePosition: true,
                waitingForNextTimelinePoint: false,
                underflowCount: 0,
                resetCount: 0
            });
        }
    }
}

function updateAvailableLines(
    vehicleStates: Map<string, VehiclePlaybackState>,
    previousLines: string[],
    listeners: Set<BusradarAvailableLinesListener>
) {
    const nextLines = Array.from(
        new Set(
            Array.from(vehicleStates.values())
                .map((state) => getFeatureLineText(state.feature))
                .filter((line): line is string => Boolean(line))
        )
    ).sort(compareLineTexts);

    if (!arraysAreEqual(previousLines, nextLines)) {
        notifyAvailableLines(listeners, nextLines);
    }

    return nextLines;
}

function applyLineFilter(
    vehicleStates: Map<string, VehiclePlaybackState>,
    selectedLineFilter: Set<string>
) {
    for (const state of vehicleStates.values()) {
        setFeatureLineVisibility(state.feature, selectedLineFilter);
    }
}

function setFeatureLineVisibility(feature: Feature, selectedLineFilter: Set<string>) {
    const isVisible = isLineVisible(getFeatureLineText(feature), selectedLineFilter);
    if (feature.get(BUSRADAR_LINE_VISIBLE_PROPERTY) !== isVisible) {
        feature.set(BUSRADAR_LINE_VISIBLE_PROPERTY, isVisible, true);
        feature.changed();
    }
}

function isLineVisible(line: string | undefined, selectedLineFilter: Set<string>) {
    return selectedLineFilter.size === 0 || selectedLineFilter.has(normalizeLineFilterValue(line));
}

function getFeatureLineText(feature: Feature | FeatureLike) {
    const line = feature.get("linientext");
    return typeof line === "string" ? line.trim() || undefined : undefined;
}

function normalizeLineFilterValue(value: unknown) {
    return typeof value === "string" ? value.trim().toLocaleLowerCase("de-DE") : "";
}

function compareLineTexts(first: string, second: string) {
    const firstNumber = /^\d+$/.test(first) ? Number(first) : undefined;
    const secondNumber = /^\d+$/.test(second) ? Number(second) : undefined;

    if (firstNumber !== undefined && secondNumber !== undefined) {
        return firstNumber - secondNumber;
    }
    if (firstNumber !== undefined) {
        return -1;
    }
    if (secondNumber !== undefined) {
        return 1;
    }

    return first.localeCompare(second, "de-DE", { numeric: true, sensitivity: "base" });
}

function arraysAreEqual(first: string[], second: string[]) {
    return first.length === second.length && first.every((value, index) => value === second[index]);
}

function addBufferedPosition(state: VehiclePlaybackState, position: BufferedVehiclePosition) {
    const sameTimestampIndex = state.bufferedPositions.findIndex(
        (candidate) => candidate.timestamp === position.timestamp
    );

    if (sameTimestampIndex >= 0) {
        const existingPosition = state.bufferedPositions[sameTimestampIndex];
        if (!existingPosition) {
            return;
        }
        if (coordinatesAreEqual(existingPosition.lonLatCoordinate, position.lonLatCoordinate)) {
            return;
        }

        const positionsWithoutDuplicate = state.bufferedPositions.filter(
            (_, index) => index !== sameTimestampIndex
        );
        const fitResult = getTimelineFitResult(positionsWithoutDuplicate, position);
        if (!fitResult.ok) {
            resetVehicleTimeline(state, position, fitResult);
            return;
        }

        state.bufferedPositions[sameTimestampIndex] = position;
        state.bufferedPositions.sort((a, b) => a.timestamp - b.timestamp);
        return;
    }

    const fitResult = getTimelineFitResult(state.bufferedPositions, position);
    if (!fitResult.ok) {
        resetVehicleTimeline(state, position, fitResult);
        return;
    }

    state.bufferedPositions.push(position);
    state.bufferedPositions.sort((a, b) => a.timestamp - b.timestamp);

    if (state.waitingForNextTimelinePoint && state.bufferedPositions.length >= 2) {
        state.waitingForNextTimelinePoint = false;
        state.recovery = {
            fromCoordinate: state.displayedCoordinate,
            startedAt: Date.now(),
            duration: BUS_RECOVERY_TRANSITION_MS
        };
        // Neue Timeline nach Recovery: Segment-Projektions-Cache verwerfen.
        state.routeSegmentProjection = undefined;
    }
}

function resetVehicleTimeline(
    state: VehiclePlaybackState,
    position: BufferedVehiclePosition,
    fitResult: Exclude<TimelineFitResult, { ok: true }>
) {
    state.bufferedPositions = [position];
    state.resetCount++;
    state.recovery = undefined;
    // Timeline-Reset: Segment-Projektions-Cache verwerfen (neue Grenzpositionen).
    state.routeSegmentProjection = undefined;
    // Keep the last plausible visible marker position. The new point only starts a new
    // timeline and becomes visible once a second compatible point arrives.
    state.waitingForNextTimelinePoint = state.hasVisiblePosition;
    logVehicleDebug(state, "holding", {
        event: "reset",
        reason: fitResult.reason,
        timeDeltaMs: fitResult.timeDeltaMs,
        speedMetersPerSecond: fitResult.speedMetersPerSecond
    });
}

function getTimelineFitResult(
    bufferedPositions: BufferedVehiclePosition[],
    position: BufferedVehiclePosition
): TimelineFitResult {
    const previousPosition = [...bufferedPositions]
        .reverse()
        .find((candidate) => candidate.timestamp < position.timestamp);
    const nextPosition = bufferedPositions.find(
        (candidate) => candidate.timestamp > position.timestamp
    );

    if (previousPosition) {
        const previousFit = getPositionConnectionResult(previousPosition, position);
        if (!previousFit.ok) {
            return previousFit;
        }
    }

    if (nextPosition) {
        const nextFit = getPositionConnectionResult(position, nextPosition);
        if (!nextFit.ok) {
            return nextFit;
        }
    }

    return { ok: true };
}

function getPositionConnectionResult(
    startPosition: BufferedVehiclePosition,
    endPosition: BufferedVehiclePosition
): TimelineFitResult {
    const timeDeltaMs = endPosition.timestamp - startPosition.timestamp;
    if (timeDeltaMs <= 0) {
        return { ok: false, reason: "time", timeDeltaMs };
    }
    if (timeDeltaMs > BUS_MAX_INTERPOLATION_GAP_MS) {
        return { ok: false, reason: "gap", timeDeltaMs };
    }

    const distanceMeters = getDistance(
        startPosition.lonLatCoordinate,
        endPosition.lonLatCoordinate
    );
    const speedMetersPerSecond = distanceMeters / (timeDeltaMs / 1000);
    if (speedMetersPerSecond > BUS_MAX_PLAUSIBLE_SPEED_MPS) {
        return { ok: false, reason: "speed", timeDeltaMs, speedMetersPerSecond };
    }

    return { ok: true };
}

function updateVehiclePlaybackPosition(
    state: VehiclePlaybackState,
    playbackTime: number,
    tripRouteCache: TripRouteCache
) {
    const playbackCoordinate = getPlaybackCoordinate(state, playbackTime, tripRouteCache);
    if (!playbackCoordinate) {
        return;
    }

    const coordinate = applyVisualRecovery(state, playbackCoordinate.coordinate);
    const status: VehiclePlaybackStatus = state.recovery ? "recovering" : playbackCoordinate.status;
    setDisplayedVehiclePose(state, coordinate, playbackCoordinate.rotation);
    logVehicleDebug(state, status, {
        playbackTime,
        bufferSize: state.bufferedPositions.length,
        startTimestamp: playbackCoordinate.startPosition?.timestamp,
        endTimestamp: playbackCoordinate.endPosition?.timestamp,
        progress: playbackCoordinate.progress,
        rotation: state.displayedRotation,
        timeSinceLastUpdateMs: Date.now() - state.lastUpdateReceivedAt
    });
}

function getPlaybackCoordinate(
    state: VehiclePlaybackState,
    playbackTime: number,
    tripRouteCache: TripRouteCache
): PlaybackCoordinateResult | undefined {
    const positions = state.bufferedPositions;
    if (positions.length === 0) {
        return undefined;
    }

    if (positions.length === 1) {
        const onlyPosition = positions[0];
        if (!onlyPosition) {
            return undefined;
        }
        if (!state.waitingForNextTimelinePoint) {
            return { coordinate: onlyPosition.mapCoordinate, status: "holding" };
        }
        return { coordinate: state.displayedCoordinate, status: "waiting" };
    }

    const firstPosition = positions[0];
    if (!firstPosition) {
        return undefined;
    }
    if (playbackTime <= firstPosition.timestamp) {
        return { coordinate: firstPosition.mapCoordinate, status: "holding" };
    }

    const nextPositionIndex = positions.findIndex((position) => position.timestamp > playbackTime);
    if (nextPositionIndex === -1) {
        return { coordinate: state.displayedCoordinate, status: "underflow" };
    }

    const startPosition = positions[nextPositionIndex - 1];
    const endPosition = positions[nextPositionIndex];
    if (!startPosition || !endPosition) {
        return undefined;
    }
    const segmentDuration = endPosition.timestamp - startPosition.timestamp;

    if (segmentDuration <= 0) {
        return { coordinate: startPosition.mapCoordinate, status: "holding" };
    }

    const progress = clamp((playbackTime - startPosition.timestamp) / segmentDuration, 0, 1);
    const routePlayback = getRoutePlaybackCoordinate(
        state,
        tripRouteCache,
        startPosition,
        endPosition,
        progress
    );
    const fallbackCoordinate = interpolateCoordinates(
        startPosition.mapCoordinate,
        endPosition.mapCoordinate,
        progress
    );

    return {
        coordinate: routePlayback?.coordinate ?? fallbackCoordinate,
        rotation:
            routePlayback?.rotation ??
            getAngleBetweenCoordinates(startPosition.mapCoordinate, endPosition.mapCoordinate),
        status: "interpolating",
        startPosition,
        endPosition,
        progress
    };
}

function getRoutePlaybackCoordinate(
    state: VehiclePlaybackState,
    tripRouteCache: TripRouteCache,
    startPosition: BufferedVehiclePosition,
    endPosition: BufferedVehiclePosition,
    progress: number
): RoutePlaybackResult | undefined {
    const routeEntry = tripRouteCache.get(state.id);
    if (routeEntry?.status !== "loaded") {
        return undefined;
    }

    const { startProjection, endProjection } = getSegmentRouteProjections(
        state,
        routeEntry.route,
        startPosition,
        endPosition
    );
    if (!startProjection || !endProjection) {
        return undefined;
    }

    if (
        startProjection.snapDistanceMeters > ROUTE_MAX_SNAP_DISTANCE_M ||
        endProjection.snapDistanceMeters > ROUTE_MAX_SNAP_DISTANCE_M
    ) {
        return undefined;
    }

    const routeDistanceDelta =
        endProjection.distanceAlongRoute - startProjection.distanceAlongRoute;
    if (routeDistanceDelta < -ROUTE_BACKTRACK_TOLERANCE_M) {
        return undefined;
    }

    const targetDistance =
        startProjection.distanceAlongRoute + Math.max(routeDistanceDelta, 0) * progress;
    const coordinate = getCoordinateAtRouteDistance(routeEntry.route, targetDistance);
    const rotation = getRouteRotationAtDistance(routeEntry.route, targetDistance);
    if (rotation === undefined) {
        return undefined;
    }

    return { coordinate, rotation, distanceAlongRoute: targetDistance };
}

/**
 * Liefert die Routen-Projektionen der beiden Segment-Grenzpositionen. Ergebnisse werden pro
 * Fahrzeug für das aktuelle Segment (Grenzpositionen + Route) gecacht und nur bei Segmentwechsel
 * neu berechnet. Die Identitätsprüfung über Objektreferenzen invalidiert automatisch bei jeder
 * Timeline-Änderung (neue/ersetzte Position, Reset erzeugt neue Objekte). Rückgabewerte sind
 * fachlich identisch zur direkten Projektion.
 */
function getSegmentRouteProjections(
    state: VehiclePlaybackState,
    route: BusradarTripRoute,
    startPosition: BufferedVehiclePosition,
    endPosition: BufferedVehiclePosition
): RouteSegmentProjectionCache {
    const cached = state.routeSegmentProjection;
    if (
        cached &&
        cached.startPosition === startPosition &&
        cached.endPosition === endPosition &&
        cached.route === route
    ) {
        return cached;
    }

    const next: RouteSegmentProjectionCache = {
        startPosition,
        endPosition,
        route,
        startProjection: projectPositionOnRoute(route, startPosition),
        endProjection: projectPositionOnRoute(route, endPosition)
    };
    state.routeSegmentProjection = next;
    return next;
}

function ensureTripRoute(tripId: string, tripRouteCache: TripRouteCache) {
    const existing = tripRouteCache.get(tripId);
    if (existing) {
        // Loaded/loading/api-empty bleiben bestehen. Ein fehlgeschlagener Abruf wird erst nach der
        // Cooldown-Zeit erneut versucht, damit spätere gültige Daten übernommen werden können.
        if (existing.status !== "failed") {
            return;
        }
        if (Date.now() - existing.failedAt < TRIP_ROUTE_RETRY_TTL_MS) {
            return;
        }
    }

    const promise = loadTripRouteFeature(tripId)
        .then((result) => {
            if (result.route) {
                tripRouteCache.set(tripId, { status: "loaded", route: result.route });
                return result.route;
            }
            const properties = result.properties;
            // Kein API-LineString, aber Fahrt-Metadaten (insb. fpl_id): die Route sofort (eager)
            // aus der GTFS-Shape rekonstruieren, damit nicht nur die Auswahl, sondern auch das
            // allgemeine Fahrzeug-Playback dieselbe geladene Route nutzt. resolveGtfsFallbackRoute
            // setzt den Cache anschließend auf `loaded` bzw. `failed`.
            if (properties?.fpl_id) {
                return resolveGtfsFallbackRoute(tripId, properties, tripRouteCache);
            }
            tripRouteCache.set(tripId, { status: "failed", failedAt: Date.now() });
            return undefined;
        })
        .catch((error) => {
            tripRouteCache.set(tripId, { status: "failed", failedAt: Date.now() });
            if (BUSRADAR_DEBUG) {
                console.debug("Busradar route could not be loaded", { tripId, error });
            }
            return undefined;
        });

    tripRouteCache.set(tripId, { status: "loading", promise });
}

async function getTripRoute(tripId: string, tripRouteCache: TripRouteCache) {
    ensureTripRoute(tripId, tripRouteCache);
    let entry = tripRouteCache.get(tripId);
    if (entry?.status === "loading") {
        await entry.promise;
        entry = tripRouteCache.get(tripId);
    }
    if (entry?.status === "loaded") {
        return entry.route;
    }
    return undefined;
}

// Rekonstruiert die Fahrtroute aus dem lokalen GTFS-Feed (shapes.txt), wenn der Busradar-
// Fahrtendpunkt zwar eine fpl_id, aber keine nutzbare Geometrie liefert. Der Shape-Lookup ist
// unabhängig vom stop_times-/Haltestellen-Join; die Busradar-Properties (insb. fpl_id) bleiben in
// der erzeugten Route erhalten. Erfolg wird als reguläre `loaded`-Route gecacht, damit sowohl das
// Fahrzeug-Playback als auch der getRouteSplit-/Render-Pfad unverändert weiterarbeiten.
async function resolveGtfsFallbackRoute(
    tripId: string,
    properties: BusradarProperties,
    tripRouteCache: TripRouteCache
): Promise<BusradarTripRoute | undefined> {
    const fplId = properties.fpl_id;
    if (!fplId) {
        tripRouteCache.set(tripId, { status: "failed", failedAt: Date.now() });
        return undefined;
    }

    try {
        const shapePath = await loadGtfsTripShapePath(fplId, tripId);
        const route = shapePath
            ? buildTripRouteFromLonLat(tripId, shapePath, properties)
            : undefined;
        if (!route) {
            tripRouteCache.set(tripId, { status: "failed", failedAt: Date.now() });
            return undefined;
        }
        tripRouteCache.set(tripId, { status: "loaded", route });
        return route;
    } catch (error) {
        tripRouteCache.set(tripId, { status: "failed", failedAt: Date.now() });
        if (BUSRADAR_DEBUG) {
            console.debug("Busradar GTFS fallback route could not be built", { tripId, error });
        }
        return undefined;
    }
}

async function loadTripRouteFeature(
    tripId: string
): Promise<{ route?: BusradarTripRoute; properties?: BusradarProperties }> {
    const response = await fetch(`${BUSRADAR_TRIP_ROUTE_URL}/${encodeURIComponent(tripId)}`);
    if (!response.ok) {
        return {};
    }

    const routeFeature = (await response.json()) as BusradarTripRouteFeature;
    return {
        route: createTripRoute(tripId, routeFeature),
        properties: routeFeature.properties
    };
}

function createTripRoute(tripId: string, routeFeature: BusradarTripRouteFeature) {
    // Busradar-Geometrie ist die Primärquelle; nur ein gültiger LineString wird direkt verwendet.
    if (routeFeature.geometry?.type !== "LineString") {
        return undefined;
    }

    return buildTripRouteFromLonLat(
        tripId,
        routeFeature.geometry.coordinates ?? [],
        routeFeature.properties ?? {}
    );
}

// Erzeugt aus einer LonLat-Punktfolge (API-Geometrie oder GTFS-Shape) die interne
// BusradarTripRoute-Struktur: validieren, aufeinanderfolgende Duplikate entfernen, nach EPSG:3857
// transformieren und kumulative geodätische Distanzen berechnen. Identisch für beide Quellen,
// damit getRouteSplit und der Route-Renderer unverändert weiterarbeiten.
function buildTripRouteFromLonLat(
    tripId: string,
    coordinates: [number, number][],
    properties: BusradarProperties
): BusradarTripRoute | undefined {
    const lonLatCoordinates = (coordinates ?? []).filter(isValidCoordinate);
    if (lonLatCoordinates.length < 2) {
        return undefined;
    }

    const deduplicatedLonLatCoordinates: [number, number][] = [];
    for (const coordinate of lonLatCoordinates) {
        const previousCoordinate =
            deduplicatedLonLatCoordinates[deduplicatedLonLatCoordinates.length - 1];
        if (!previousCoordinate || !coordinatesAreEqual(previousCoordinate, coordinate)) {
            deduplicatedLonLatCoordinates.push(coordinate);
        }
    }

    if (deduplicatedLonLatCoordinates.length < 2) {
        return undefined;
    }

    const mapCoordinates = deduplicatedLonLatCoordinates.map(
        (coordinate) => fromLonLat(coordinate) as [number, number]
    );
    const cumulativeDistances = [0];

    for (let index = 1; index < deduplicatedLonLatCoordinates.length; index++) {
        const previousCoordinate = deduplicatedLonLatCoordinates[index - 1];
        const coordinate = deduplicatedLonLatCoordinates[index];
        if (!previousCoordinate || !coordinate) {
            continue;
        }

        const previousDistance = cumulativeDistances[cumulativeDistances.length - 1] ?? 0;
        cumulativeDistances.push(previousDistance + getDistance(previousCoordinate, coordinate));
    }

    const lengthMeters = cumulativeDistances[cumulativeDistances.length - 1] ?? 0;
    if (lengthMeters <= 0) {
        return undefined;
    }

    return {
        id: tripId,
        lonLatCoordinates: deduplicatedLonLatCoordinates,
        mapCoordinates,
        cumulativeDistances,
        lengthMeters,
        properties
    } satisfies BusradarTripRoute;
}

function projectPositionOnRoute(
    route: BusradarTripRoute,
    position: BufferedVehiclePosition
): BusradarRouteProjection | undefined {
    return projectCoordinateOnRoute(route, position.mapCoordinate, position.lonLatCoordinate);
}

function projectCoordinateOnRoute(
    route: BusradarTripRoute,
    mapCoordinate: [number, number],
    lonLatCoordinate?: [number, number]
): BusradarRouteProjection | undefined {
    let closestProjection: BusradarRouteProjection | undefined;
    let closestMapDistanceSquared = Number.POSITIVE_INFINITY;

    for (let index = 1; index < route.mapCoordinates.length; index++) {
        const startMapCoordinate = route.mapCoordinates[index - 1];
        const endMapCoordinate = route.mapCoordinates[index];
        const startLonLatCoordinate = route.lonLatCoordinates[index - 1];
        const endLonLatCoordinate = route.lonLatCoordinates[index];
        const startDistance = route.cumulativeDistances[index - 1];
        const endDistance = route.cumulativeDistances[index];

        if (
            !startMapCoordinate ||
            !endMapCoordinate ||
            !startLonLatCoordinate ||
            !endLonLatCoordinate ||
            startDistance === undefined ||
            endDistance === undefined
        ) {
            continue;
        }

        const projection = projectMapCoordinateOnSegment(
            mapCoordinate,
            startMapCoordinate,
            endMapCoordinate
        );
        if (!projection || projection.mapDistanceSquared >= closestMapDistanceSquared) {
            continue;
        }

        closestMapDistanceSquared = projection.mapDistanceSquared;
        const projectedLonLatCoordinate = interpolateCoordinates(
            startLonLatCoordinate,
            endLonLatCoordinate,
            projection.progress
        );
        closestProjection = {
            distanceAlongRoute: startDistance + (endDistance - startDistance) * projection.progress,
            snapDistanceMeters: getDistance(
                lonLatCoordinate ?? (toLonLatSafe(mapCoordinate) as [number, number]),
                projectedLonLatCoordinate
            )
        };
    }

    return closestProjection;
}

export function projectBusradarCoordinateOnRoute(
    route: BusradarTripRoute,
    mapCoordinate: [number, number]
) {
    return projectCoordinateOnRoute(route, mapCoordinate);
}

function projectMapCoordinateOnSegment(
    coordinate: [number, number],
    segmentStart: [number, number],
    segmentEnd: [number, number]
) {
    const deltaX = segmentEnd[0] - segmentStart[0];
    const deltaY = segmentEnd[1] - segmentStart[1];
    const segmentLengthSquared = deltaX * deltaX + deltaY * deltaY;
    if (segmentLengthSquared <= 0) {
        return undefined;
    }

    const progress = clamp(
        ((coordinate[0] - segmentStart[0]) * deltaX + (coordinate[1] - segmentStart[1]) * deltaY) /
            segmentLengthSquared,
        0,
        1
    );
    const projectedCoordinate: [number, number] = [
        segmentStart[0] + deltaX * progress,
        segmentStart[1] + deltaY * progress
    ];
    const distanceX = coordinate[0] - projectedCoordinate[0];
    const distanceY = coordinate[1] - projectedCoordinate[1];

    return {
        progress,
        mapDistanceSquared: distanceX * distanceX + distanceY * distanceY
    };
}

function getCoordinateAtRouteDistance(
    route: BusradarTripRoute,
    distanceAlongRoute: number
): [number, number] {
    const targetDistance = clamp(distanceAlongRoute, 0, route.lengthMeters);

    for (let index = 1; index < route.cumulativeDistances.length; index++) {
        const startDistance = route.cumulativeDistances[index - 1];
        const endDistance = route.cumulativeDistances[index];
        const startCoordinate = route.mapCoordinates[index - 1];
        const endCoordinate = route.mapCoordinates[index];

        if (
            startDistance === undefined ||
            endDistance === undefined ||
            !startCoordinate ||
            !endCoordinate
        ) {
            continue;
        }

        if (targetDistance <= endDistance) {
            const segmentLength = endDistance - startDistance;
            const progress =
                segmentLength > 0 ? (targetDistance - startDistance) / segmentLength : 0;
            return interpolateCoordinates(startCoordinate, endCoordinate, clamp(progress, 0, 1));
        }
    }

    return (
        route.mapCoordinates[route.mapCoordinates.length - 1] ?? route.mapCoordinates[0] ?? [0, 0]
    );
}

function getRouteRotationAtDistance(route: BusradarTripRoute, distanceAlongRoute: number) {
    const previousDistance = clamp(
        distanceAlongRoute - ROUTE_ROTATION_SAMPLE_DISTANCE_M,
        0,
        route.lengthMeters
    );
    const nextDistance = clamp(
        distanceAlongRoute + ROUTE_ROTATION_SAMPLE_DISTANCE_M,
        0,
        route.lengthMeters
    );

    if (nextDistance <= previousDistance) {
        return undefined;
    }

    return getAngleBetweenCoordinates(
        getCoordinateAtRouteDistance(route, previousDistance),
        getCoordinateAtRouteDistance(route, nextDistance)
    );
}

function splitRouteAtDistance(
    route: BusradarTripRoute,
    distanceAlongRoute: number,
    projection: BusradarRouteProjection
): BusradarRouteSplit {
    const splitCoordinate = getCoordinateAtRouteDistance(route, distanceAlongRoute);
    const passedCoordinates: [number, number][] = [];
    const upcomingCoordinates: [number, number][] = [splitCoordinate];

    for (let index = 0; index < route.mapCoordinates.length; index++) {
        const coordinate = route.mapCoordinates[index];
        const distance = route.cumulativeDistances[index];
        if (!coordinate || distance === undefined) {
            continue;
        }

        if (distance < distanceAlongRoute) {
            passedCoordinates.push(coordinate);
        } else {
            upcomingCoordinates.push(coordinate);
        }
    }

    passedCoordinates.push(splitCoordinate);
    return { route, passedCoordinates, upcomingCoordinates, projection };
}

function getFeatureProperties(feature: Feature<Point>): BusradarProperties {
    return {
        operation: feature.get("operation"),
        fahrzeugid: feature.get("fahrzeugid"),
        fahrtbezeichner: feature.get("fahrtbezeichner"),
        linientext: feature.get("linientext"),
        richtungstext: feature.get("richtungstext"),
        delay: feature.get("delay"),
        visfahrplanlagezst: feature.get("visfahrplanlagezst"),
        sequenz: feature.get("sequenz"),
        starthst: feature.get("starthst"),
        zielhst: feature.get("zielhst"),
        fpl_id: feature.get("fpl_id"),
        line_id: feature.get("line_id"),
        startzeit: feature.get("startzeit"),
        endzeit: feature.get("endzeit")
    };
}

function toLonLatSafe(coordinate: [number, number]) {
    const lonLat = toLonLat(coordinate);
    return [lonLat[0], lonLat[1]];
}

function applyVisualRecovery(
    state: VehiclePlaybackState,
    targetCoordinate: [number, number]
): [number, number] {
    const recovery = state.recovery;
    if (!recovery) {
        return targetCoordinate;
    }

    const progress = clamp((Date.now() - recovery.startedAt) / recovery.duration, 0, 1);
    if (progress >= 1) {
        state.recovery = undefined;
        return targetCoordinate;
    }

    return interpolateCoordinates(recovery.fromCoordinate, targetCoordinate, progress);
}

function setDisplayedVehiclePose(
    state: VehiclePlaybackState,
    coordinate: [number, number],
    rotation?: number
) {
    state.displayedCoordinate = coordinate;
    state.hasVisiblePosition = true;
    state.feature.getGeometry()?.setCoordinates(coordinate);

    const nextRotation = getSmoothedRotation(state.displayedRotation, rotation);
    if (nextRotation !== undefined) {
        const iconFacing = getBusIconFacing(state.displayedIconFacing, nextRotation);
        state.displayedRotation = nextRotation;
        state.displayedIconFacing = iconFacing;
        state.feature.set(BUSRADAR_ICON_FACING_PROPERTY, iconFacing);
        state.feature.set(
            BUSRADAR_ROTATION_PROPERTY,
            getBusIconDisplayRotation(nextRotation, iconFacing)
        );
    }
}

function interpolateCoordinates(
    startCoordinate: [number, number],
    endCoordinate: [number, number],
    progress: number
): [number, number] {
    return [
        startCoordinate[0] + (endCoordinate[0] - startCoordinate[0]) * progress,
        startCoordinate[1] + (endCoordinate[1] - startCoordinate[1]) * progress
    ];
}

function getAngleBetweenCoordinates(
    startCoordinate: [number, number],
    endCoordinate: [number, number]
) {
    const deltaX = endCoordinate[0] - startCoordinate[0];
    const deltaY = endCoordinate[1] - startCoordinate[1];
    if (deltaX * deltaX + deltaY * deltaY < BUS_ROTATION_MIN_DISTANCE_SQUARED) {
        return undefined;
    }

    // The SVG's front points to the right at rotation 0. Map coordinates use a north-up
    // y-axis, while icon rotation is screen-oriented; invert y so heading and icon agree.
    return Math.atan2(-deltaY, deltaX);
}

function getSmoothedRotation(
    previousRotation: number | undefined,
    nextRotation: number | undefined
) {
    if (nextRotation === undefined) {
        return previousRotation;
    }
    if (previousRotation === undefined) {
        return normalizeAngle(nextRotation);
    }

    const delta = getShortestAngleDelta(previousRotation, nextRotation);
    return normalizeAngle(previousRotation + delta * BUS_ROTATION_SMOOTHING);
}

function getBusIconFacing(
    previousFacing: BusradarBusIconFacing | undefined,
    routeRotation: number
): BusradarBusIconFacing {
    const horizontalDirection = Math.cos(routeRotation);
    if (horizontalDirection > 0.15) {
        return "right";
    }
    if (horizontalDirection < -0.15) {
        return "left";
    }
    return previousFacing ?? "right";
}

function getBusIconDisplayRotation(routeRotation: number, facing: BusradarBusIconFacing) {
    // Right-facing SVGs point east at rotation 0. Left-facing SVGs are mirrored and point west
    // at rotation 0, so their displayed rotation is relative to a west-facing base heading.
    return facing === "left" ? normalizeAngle(routeRotation - Math.PI) : routeRotation;
}

function getShortestAngleDelta(from: number, to: number) {
    return normalizeAngle(to - from);
}

function normalizeAngle(angle: number) {
    let normalized = angle;
    while (normalized <= -Math.PI) {
        normalized += Math.PI * 2;
    }
    while (normalized > Math.PI) {
        normalized -= Math.PI * 2;
    }
    return normalized;
}

function cleanupVehicleBuffer(state: VehiclePlaybackState, playbackTime: number) {
    const positions = state.bufferedPositions;
    if (positions.length <= 2) {
        return;
    }

    const nextPositionIndex = positions.findIndex((position) => position.timestamp > playbackTime);
    let keepFromIndex = 0;

    if (nextPositionIndex > 0) {
        keepFromIndex = nextPositionIndex - 1;
    } else if (nextPositionIndex === -1) {
        keepFromIndex = positions.length - 1;
    }

    const earliestTimestamp = playbackTime - BUS_POSITION_MAX_AGE_MS;
    while (keepFromIndex > 0 && positions.length - keepFromIndex < BUS_POSITION_MAX_BUFFER_SIZE) {
        const previousPosition = positions[keepFromIndex - 1];
        if (!previousPosition || previousPosition.timestamp < earliestTimestamp) {
            break;
        }
        keepFromIndex--;
    }

    while (positions.length - keepFromIndex > BUS_POSITION_MAX_BUFFER_SIZE) {
        keepFromIndex++;
    }

    if (keepFromIndex > 0) {
        state.bufferedPositions = positions.slice(keepFromIndex);
    }
}

function removeVehicleFeature(
    source: VectorSource,
    vehicleStates: Map<string, VehiclePlaybackState>,
    id: string,
    fahrtbezeichner?: string,
    fahrzeugid?: string,
    vehicleUpdateListeners?: Map<string, Set<BusradarVehicleUpdateListener>>
) {
    const state = vehicleStates.get(id);
    if (state) {
        removeVehicleState(source, vehicleStates, state, vehicleUpdateListeners);
        return;
    }

    if (fahrtbezeichner) {
        const stateByTrip = Array.from(vehicleStates.values()).find(
            (candidate) => candidate.feature.get("fahrtbezeichner") === fahrtbezeichner
        );
        if (stateByTrip) {
            removeVehicleState(source, vehicleStates, stateByTrip, vehicleUpdateListeners);
            return;
        }
    }

    if (fahrzeugid) {
        const stateByVehicleId = Array.from(vehicleStates.values()).find(
            (candidate) => candidate.feature.get("fahrzeugid") === fahrzeugid
        );
        if (stateByVehicleId) {
            removeVehicleState(source, vehicleStates, stateByVehicleId, vehicleUpdateListeners);
        }
    }
}

function removeVehicleState(
    source: VectorSource,
    vehicleStates: Map<string, VehiclePlaybackState>,
    state: VehiclePlaybackState,
    vehicleUpdateListeners?: Map<string, Set<BusradarVehicleUpdateListener>>
) {
    source.removeFeature(state.feature);
    vehicleStates.delete(state.id);
    debugVehicleIds.delete(state.id);
    if (vehicleUpdateListeners) {
        notifyVehicleUpdate(vehicleUpdateListeners, state.id, undefined);
    }
}

function getSelectedVehicleFromState(state: VehiclePlaybackState): BusradarSelectedVehicle {
    return {
        id: state.id,
        coordinate: state.displayedCoordinate,
        properties: getFeatureProperties(state.feature)
    };
}

function setSelectedVehicleState(
    vehicleStates: Map<string, VehiclePlaybackState>,
    id: string | undefined,
    isSelected: boolean
) {
    if (!id) {
        return;
    }

    const state = vehicleStates.get(id);
    if (!state || state.feature.get(BUSRADAR_SELECTED_PROPERTY) === isSelected) {
        return;
    }

    state.feature.set(BUSRADAR_SELECTED_PROPERTY, isSelected);
}

function notifyVehicleUpdate(
    vehicleUpdateListeners: Map<string, Set<BusradarVehicleUpdateListener>>,
    id: string,
    vehicle: BusradarSelectedVehicle | undefined
) {
    const listeners = vehicleUpdateListeners.get(id);
    if (!listeners) {
        return;
    }

    for (const listener of listeners) {
        listener(vehicle);
    }
}

function notifyAllVehicleRemoved(
    vehicleUpdateListeners: Map<string, Set<BusradarVehicleUpdateListener>>
) {
    for (const [id] of vehicleUpdateListeners) {
        notifyVehicleUpdate(vehicleUpdateListeners, id, undefined);
    }
}

function notifyAvailableLines(listeners: Set<BusradarAvailableLinesListener>, lines: string[]) {
    for (const listener of listeners) {
        listener(lines);
    }
}

function logVehicleDebug(
    state: VehiclePlaybackState,
    status: VehiclePlaybackStatus,
    details: Record<string, unknown>
) {
    const statusChanged = state.debugStatus !== status;
    if (statusChanged && status === "underflow") {
        state.underflowCount++;
    }
    state.debugStatus = status;

    if (!BUSRADAR_DEBUG || (!statusChanged && !("event" in details))) {
        return;
    }

    if (!debugVehicleIds.has(state.id)) {
        if (debugVehicleIds.size >= BUSRADAR_DEBUG_BUS_LIMIT) {
            return;
        }
        debugVehicleIds.add(state.id);
    }

    console.debug("Busradar Playback", {
        id: state.id,
        status,
        bufferSize: state.bufferedPositions.length,
        latestTimestamp: state.bufferedPositions[state.bufferedPositions.length - 1]?.timestamp,
        lastUpdateReceivedAt: state.lastUpdateReceivedAt,
        timeSinceLastUpdateMs: Date.now() - state.lastUpdateReceivedAt,
        underflowCount: state.underflowCount,
        resetCount: state.resetCount,
        ...details
    });
}

function getVehicleId(properties?: BusradarProperties) {
    // `fahrtbezeichner` was complete and unique in observed REST/WebSocket data.
    // `fahrzeugid` can occur on multiple active trips and is only a fallback.
    return properties?.fahrtbezeichner ?? properties?.fahrzeugid;
}

function getPositionTimestamp(properties: BusradarProperties | undefined, receivedAt: number) {
    // Busradar exposes the vehicle position timestamp as a Unix timestamp in seconds.
    // The receipt time is only a fallback for missing or implausible API timestamps.
    const apiTimestampSeconds = properties?.visfahrplanlagezst;
    if (typeof apiTimestampSeconds !== "number" || !Number.isFinite(apiTimestampSeconds)) {
        return receivedAt;
    }

    const timestamp = apiTimestampSeconds * 1000;
    if (
        timestamp < receivedAt - API_TIMESTAMP_MAX_PAST_MS ||
        timestamp > receivedAt + API_TIMESTAMP_MAX_FUTURE_MS
    ) {
        return receivedAt;
    }

    return timestamp;
}

function coordinatesAreEqual(first: [number, number], second: [number, number]) {
    return first[0] === second[0] && first[1] === second[1];
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function isValidCoordinate(coordinates: unknown): coordinates is [number, number] {
    return (
        Array.isArray(coordinates) &&
        coordinates.length === 2 &&
        typeof coordinates[0] === "number" &&
        typeof coordinates[1] === "number" &&
        Number.isFinite(coordinates[0]) &&
        Number.isFinite(coordinates[1])
    );
}

const busSvgDataUrlCache = new Map<string, string>();

export function getBusradarBusSvgDataUrl(
    color: string,
    isSelected = false,
    facing: BusradarBusIconFacing = "right"
) {
    const cacheKey = `${facing}|${color}|${isSelected ? "selected" : "normal"}`;
    const cachedUrl = busSvgDataUrlCache.get(cacheKey);
    if (cachedUrl) {
        return cachedUrl;
    }

    const url = `data:image/svg+xml;utf8,${encodeURIComponent(createBusradarBusSvg(color, isSelected, facing))}`;
    busSvgDataUrlCache.set(cacheKey, url);
    return url;
}

export function getBusradarDelayStatus(value: unknown): BusradarDelayStatus {
    const delay = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(delay)) {
        return { color: BUSRADAR_DELAY_COLORS.gray, label: "Keine Echtzeitdaten" };
    }

    const classification = classifyBusradarDelay(delay);
    const color = getDelayColor(delay);
    if (!classification || classification.kind === "punctual") {
        return { color, label: "Pünktlich", delay };
    }

    return {
        color,
        label:
            classification.kind === "early"
                ? `${classification.minutes} Min. früher`
                : `${classification.minutes} Min. verspätet`,
        delay
    };
}

function createBusradarBusSvg(color: string, isSelected: boolean, facing: BusradarBusIconFacing) {
    const rightFacingSvg = createPremiumCompactBusSvg(color, isSelected);

    return facing === "left" ? mirrorBusSvgHorizontally(rightFacingSvg) : rightFacingSvg;
}

function mirrorBusSvgHorizontally(svg: string) {
    const openingEndIndex = svg.indexOf(">");
    const closingStartIndex = svg.lastIndexOf("</svg>");
    if (openingEndIndex < 0 || closingStartIndex < 0) {
        return svg;
    }

    const openingTag = svg.slice(0, openingEndIndex + 1).replace("nach rechts", "nach links");
    const contents = svg.slice(openingEndIndex + 1, closingStartIndex);
    return `${openingTag}<g transform="translate(96 0) scale(-1 1)">${contents}</g></svg>`;
}

function createPremiumCompactBusSvg(color: string, isSelected: boolean) {
    const halo = createBusIconHalo(isSelected);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64" viewBox="0 0 96 64" role="img" aria-label="Live-Bus, Front zeigt bei Rotation 0 nach rechts"><defs><linearGradient id="body" x1="11" y1="19" x2="85" y2="44" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${color}"/><stop offset="0.72" stop-color="${color}"/><stop offset="1" stop-color="#0f172a" stop-opacity="0.18"/></linearGradient><linearGradient id="glass" x1="17" y1="18" x2="82" y2="31" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#101827"/><stop offset="1" stop-color="#506078"/></linearGradient></defs>${halo}<ellipse cx="48" cy="50.3" rx="34" ry="4.8" fill="#0f172a" opacity="0.14"/><path d="M11.5 25.4c.2-4.7 3.8-8.5 8.5-9l48.8-5.1c4.8-.5 9.5 1.6 12.3 5.5l6.6 9.1c1.1 1.5 1.7 3.3 1.7 5.1v9.4c0 3.7-3 6.7-6.7 6.7H18.6c-4.1 0-7.4-3.4-7.3-7.5l.2-14.2Z" fill="url(#body)"/><path d="M18.7 16.6 68.9 11.3c4.8-.5 9.4 1.6 12.2 5.5l-8.3 4-55.7 5.1-5.5 2.6c.4-6.6 2.9-11.4 7.1-11.9Z" fill="#ffffff" opacity="0.16"/><path d="M18.2 25c.2-2 1.8-3.6 3.8-3.8l42.8-4.1c2.2-.2 4.1 1.4 4.4 3.6l.8 7.7H17.7l.5-3.4Z" fill="url(#glass)"/><path d="M73.7 21.1 81 17.5l5 7c.8 1.1 1.2 2.4 1.2 3.7v3.1H74.7l-1-10.2Z" fill="#162033"/><path d="M75.1 33.5h12.2v5.3c0 2.1-1.7 3.8-3.8 3.8h-7.2l-1.2-9.1Z" fill="#ffffff" opacity="0.18"/><path d="M16.1 32h55.1" stroke="#ffffff" stroke-opacity="0.36" stroke-width="2.4" stroke-linecap="round"/><path d="M21.4 39.1h21.2" stroke="#ffffff" stroke-opacity="0.5" stroke-width="2.2" stroke-linecap="round"/><path d="M51.4 39.1h13.2" stroke="#ffffff" stroke-opacity="0.34" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="25.5" cy="48" rx="6.7" ry="3.3" fill="#111827" opacity="0.72"/><ellipse cx="69.6" cy="48" rx="7" ry="3.4" fill="#111827" opacity="0.74"/><path d="M84.3 35.9h4.2" stroke="#f8fafc" stroke-opacity="0.86" stroke-width="2.3" stroke-linecap="round"/><path d="M82.1 42.2h4.1" stroke="#fed7aa" stroke-opacity="0.9" stroke-width="2.1" stroke-linecap="round"/><path d="M11.5 25.4c.2-4.7 3.8-8.5 8.5-9l48.8-5.1c4.8-.5 9.5 1.6 12.3 5.5l6.6 9.1c1.1 1.5 1.7 3.3 1.7 5.1v9.4c0 3.7-3 6.7-6.7 6.7H18.6c-4.1 0-7.4-3.4-7.3-7.5l.2-14.2Z" fill="none" stroke="#0f172a" stroke-opacity="0.16" stroke-width="1.05" stroke-linejoin="round"/></svg>`;
}

function createBusIconHalo(isSelected: boolean) {
    if (!isSelected) {
        return "";
    }

    return '<path d="M11.5 25.4c.2-4.7 3.8-8.5 8.5-9l48.8-5.1c4.8-.5 9.5 1.6 12.3 5.5l6.6 9.1c1.1 1.5 1.7 3.3 1.7 5.1v9.4c0 3.7-3 6.7-6.7 6.7H18.6c-4.1 0-7.4-3.4-7.3-7.5l.2-14.2Z" fill="none" stroke="#ffffff" stroke-opacity="0.96" stroke-width="6" stroke-linejoin="round"/><path d="M11.5 25.4c.2-4.7 3.8-8.5 8.5-9l48.8-5.1c4.8-.5 9.5 1.6 12.3 5.5l6.6 9.1c1.1 1.5 1.7 3.3 1.7 5.1v9.4c0 3.7-3 6.7-6.7 6.7H18.6c-4.1 0-7.4-3.4-7.3-7.5l.2-14.2Z" fill="none" stroke="#0f172a" stroke-opacity="0.22" stroke-width="1.5" stroke-linejoin="round"/>';
}

function createVehicleStyle(
    feature: Feature | import("ol/Feature").FeatureLike,
    resolution: number
) {
    if (feature.get(BUSRADAR_LINE_VISIBLE_PROPERTY) === false) {
        return [];
    }

    const label = getBusradarVehicleLabel(feature, resolution);
    const color = getBusradarDelayStatus(feature.get("delay")).color;
    const isSelected = feature.get(BUSRADAR_SELECTED_PROPERTY) === true;
    const facing = getFeatureIconFacing(feature);
    const cacheKey = `${facing}|${color}|${isSelected ? "selected" : "normal"}|${label.line}|${label.direction ?? ""}`;
    const rotation = Number(feature.get(BUSRADAR_ROTATION_PROPERTY) ?? 0);
    const baseScale = isSelected ? BUSRADAR_SELECTED_ICON_SCALE : BUSRADAR_ICON_SCALE;
    const targetScale = baseScale * getBusradarZoomScaleFactor(getZoomForResolution(resolution));
    const canCacheStyle = typeof (feature as { set?: unknown }).set === "function";
    const cachedStyle = canCacheStyle
        ? (feature.get(BUSRADAR_STYLE_PROPERTY) as Style | Style[] | undefined)
        : undefined;
    if (cachedStyle) {
        if (feature.get(BUSRADAR_STYLE_KEY_PROPERTY) === cacheKey) {
            const cachedStyles = Array.isArray(cachedStyle) ? cachedStyle : [cachedStyle];
            const cachedImage = cachedStyles[0]?.getImage();
            cachedImage?.setRotation(rotation);
            // Zoomabhängige Größe live nachziehen (der Cache-Key enthält den Zoom bewusst nicht).
            cachedImage?.setScale(targetScale);
            return cachedStyle;
        }
    }

    const zIndex = isSelected
        ? BUSRADAR_SELECTED_VEHICLE_STYLE_Z_INDEX
        : BUSRADAR_VEHICLE_STYLE_Z_INDEX;
    const iconStyle = new Style({
        zIndex,
        image: new Icon({
            src: getBusradarBusSvgDataUrl(color, isSelected, facing),
            anchor: BUSRADAR_ICON_ANCHOR,
            scale: targetScale,
            rotation,
            rotateWithView: true
        })
    });
    const styles = [iconStyle, ...createBusradarLabelStyles(label, zIndex, isSelected)];
    const style = styles.length === 1 ? iconStyle : styles;

    if (canCacheStyle) {
        const cacheableFeature = feature as Feature;
        cacheableFeature.set(BUSRADAR_STYLE_KEY_PROPERTY, cacheKey, true);
        cacheableFeature.set(BUSRADAR_STYLE_PROPERTY, style, true);
    }
    return style;
}

function createBusradarLabelStyles(
    label: { line: string; direction?: string },
    zIndex: number,
    isSelected: boolean
) {
    if (!label.line) {
        return [];
    }

    const text = label.direction
        ? [
              label.line,
              BUSRADAR_LABEL_LINE_FONT,
              ` – ${label.direction}`,
              BUSRADAR_LABEL_DIRECTION_FONT
          ]
        : label.line;
    return [
        new Style({
            zIndex: zIndex + 1,
            text: new Text({
                text,
                offsetY: isSelected
                    ? BUSRADAR_LABEL_OFFSET_Y_SELECTED
                    : BUSRADAR_LABEL_OFFSET_Y_DEFAULT,
                font: BUSRADAR_LABEL_TEXT_FONT,
                fill: new Fill({ color: BUSRADAR_LABEL_TEXT_COLOR }),
                stroke: new Stroke({
                    color: BUSRADAR_LABEL_HALO_COLOR,
                    width: BUSRADAR_LABEL_HALO_WIDTH
                }),
                backgroundFill: new Fill({ color: BUSRADAR_LABEL_BACKGROUND_COLOR }),
                backgroundStroke: new Stroke({
                    color: BUSRADAR_LABEL_BACKGROUND_STROKE_COLOR,
                    width: BUSRADAR_LABEL_BACKGROUND_STROKE_WIDTH
                }),
                padding: BUSRADAR_LABEL_PADDING,
                textAlign: "center"
            })
        })
    ];
}

function getBusradarVehicleLabel(
    feature: Feature | import("ol/Feature").FeatureLike,
    resolution: number
) {
    const zoom = getZoomForResolution(resolution);
    const line = normalizeBusradarLabelText(feature.get("linientext"), { allowNumeric: true });
    if (!line || zoom < BUS_LABEL_MIN_ZOOM_LINE) {
        return { line: "" };
    }

    if (zoom < BUS_LABEL_MIN_ZOOM_DIRECTION) {
        return { line };
    }

    const direction = shortenBusradarDirectionLabel(
        normalizeBusradarLabelText(feature.get("richtungstext"), { allowNumeric: false })
    );
    return direction ? { line, direction } : { line };
}

function getZoomForResolution(resolution: number) {
    return Math.log2(WEB_MERCATOR_MAX_RESOLUTION / resolution);
}

/**
 * Kontinuierlicher, beidseitig begrenzter Skalierungsfaktor der Bus-Symbole in Abhängigkeit vom
 * Karten-Zoom. Am Referenz-Zoom ist der Faktor 1.0 (heutige Größe); darunter (herausgezoomt)
 * kleiner bis `MIN_FACTOR`, darüber (hineingezoomt) größer bis `MAX_FACTOR`.
 *
 * Nicht-endliche Zoomwerte (z. B. `NaN`/`Infinity` bei ungültiger Resolution) fallen sicher auf
 * Faktor 1.0 zurück.
 */
export function getBusradarZoomScaleFactor(zoom: number) {
    if (!Number.isFinite(zoom)) {
        return 1;
    }

    const rawFactor =
        1 + (zoom - BUSRADAR_ICON_SCALE_REFERENCE_ZOOM) * BUSRADAR_ICON_SCALE_PER_ZOOM;
    return clamp(rawFactor, BUSRADAR_ICON_SCALE_MIN_FACTOR, BUSRADAR_ICON_SCALE_MAX_FACTOR);
}

function normalizeBusradarLabelText(value: unknown, options: { allowNumeric: boolean }) {
    if (typeof value !== "string") {
        return "";
    }

    const text = value.trim().replace(/\s+/g, " ");
    if (!text || /^-+$/.test(text) || (!options.allowNumeric && /^\d+$/.test(text))) {
        return "";
    }
    return text;
}

function shortenBusradarDirectionLabel(value: string) {
    if (value.length <= BUS_LABEL_DIRECTION_MAX_LENGTH) {
        return value;
    }

    const shortened = value.slice(0, BUS_LABEL_DIRECTION_MAX_LENGTH - 1).trimEnd();
    return `${shortened}…`;
}

function getFeatureIconFacing(
    feature: Feature | import("ol/Feature").FeatureLike
): BusradarBusIconFacing {
    return feature.get(BUSRADAR_ICON_FACING_PROPERTY) === "left" ? "left" : "right";
}

export function getDelayColor(delay: number) {
    if (delay > BUSRADAR_DELAY_RED_MIN_EXCLUSIVE_S) {
        return BUSRADAR_DELAY_COLORS.red;
    }
    if (delay >= BUSRADAR_DELAY_YELLOW_MIN_S) {
        return BUSRADAR_DELAY_COLORS.yellow;
    }
    return BUSRADAR_DELAY_COLORS.green;
}
