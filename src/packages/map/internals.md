This file contains detailed information about the internals of the map package. It is intended for developers who want to contribute to this package.

## Structure of layer typings and implementations

### Layer Typings

-   AnyLayerBaseType ("type" union: AnyLayer)
    -   LayerBaseType ("type" union: Layer)
        -   WMSLayer
        -   SimpleLayer
        -   WMTSLayer
        -   GroupLayer
    -   SublayerBaseType ("type" union: Sublayer)
        -   WMSSublayer

### Config Typings

-   LayerBaseConfig
    -   LayerConfig
        -   SimpleLayerConfig
        -   WMSLayerConfig
        -   WMTSLayerConfig
        -   GroupLayerConfig
    -   WMSSublayerConfig

### Layer implementations

-   AbstractLayerBase (type: AnyLayerBaseType, AbstractLayerBaseOptions)
    -   AbstractLayer (type: LayerBaseType, config: SimpleLayerConfig)
        -   SimpleLayerImpl (type: SimpleLayer, config: SimpleLayerConfig)
        -   WMSLayerImpl (type: WMSLayer, config: WMSLayerConfig)
        -   WMTSLayerImpl (type: WMTSLayer, config: WMTSLayerConfig)
        -   GroupLayer (type: GroupLayer, config: GroupLayerConfig)
    -   WMSSublayer (type: WMSSublayer, config: WMSSublayerConfig)
