## Druck von Kartendiensten liefert kein Bild

Wenn Kartendienste wie z.B. ein WMTS beim Druck nicht dargestellt werden (z.B. nur ein leeres Bild/keine Hintergrundkarte),
dann kann das daran liegen, dass der Dienst nicht richtig CORS-enabled ist (canvas tained: https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image).

Als Workaround haben wir beim Erstellen des WMTS-Objekts die Property `crossOrigin: "anonymous"` gesetzt, mit der der Dienst wieder dargestellt wurde:

```ts
new WMTS({
    // ...
    crossOrigin: "anonymous"
    // ...
});
```

## TypeDoc watch mode für einzelnes Package

`pnpm exec typedoc --watch` kann zum kontinuierlichen Bauen von Typedoc benutzt werden.
Je nach Setup wird ein Pfad zu einer `tsconfig.json` und zu einem Outputverzeichnis benötigt, z.B.

```bash
$ cd src/packages/map
$ pnpm exec typedoc --tsconfig ./../../../tsconfig.json  --out ../../../dist/docs-test --watch
```

In einem anderen Terminal dann einen Webserver starten:

```bash
$ cd dist/docs-test
$ npx serve .
```
