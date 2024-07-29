---
"@open-pioneer/measurement": minor
---

add optional properties for predefined measurements and event listener which is called when measurements are added or remove

```tsx
<Measurement
    mapId={MAP_ID}
    measurementsHandler={(e) => console.log(e.eventType)}
    predefinedMeasurments={[
        new LineString([
            [398657.97, 5755696.26],
            [402570.98, 5757547.78]
        ])
    ]}
/>
```
