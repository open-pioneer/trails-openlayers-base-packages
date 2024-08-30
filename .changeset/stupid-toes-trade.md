---
"@open-pioneer/measurement": patch
---

Add two new optional properties:

-   `predefinedMeasurements`: an array of measurements that will be added to the map (without user interaction)
-   `onMeasurementsChange`: an event listener that will be called when measurements are added or removed

```tsx
const predefinedMeasurements = useMemo(
    () => [
        new LineString([
            [398657.97, 5755696.26],
            [402570.98, 5757547.78]
        ])
    ],
    []
);

<Measurement
    mapId={MAP_ID}
    onMeasurementsChange={(e) => console.log(e.kind, e.geometry)}
    predefinedMeasurements={predefinedMeasurements}
/>;
```
