Introduce `listMode` for layer legend configurations:

```typescript
//sublayer with legend configuration
const internalLayer = new SimpleLayer({
    id: "layer1",
    title: "layer 1",
    olLayer: myOlLayer,
    visible: true,
    attributes: {
        legend: {
            listMode: "show"
        } as LegendItemAttributes
    },
    sublayers: [
        {
            name: "sublayer1",
            title: "Sub Layer 1"
        }
    ]
});
```
