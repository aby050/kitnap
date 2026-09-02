# App icons

Brand icons for the curated blocked-apps list.

**Why this folder exists:** Android hands us real launcher icons at runtime
(`getInstalledApps()` returns them as PNG data URIs), so nothing here is needed
there. iOS never exposes installed-app icons to third-party apps at all — so on
iOS the curated list has no icon source unless the artwork ships with the app.

**To use:** drop square PNGs here (96×96 or larger) and point at them from
`src/data/blockedApps.ts`:

```ts
{ name: 'Instagram', packageName: 'com.instagram.android', icon: require('../../assets/appicons/instagram.png') },
```

Rows fall back to a monogram tile for any app without one, so partial coverage
is fine.

**Before shipping:** these are third-party trademarks. Using a logo to identify
the actual app it belongs to is normally defensible, but confirm it against each
platform's brand guidelines — several restrict how their mark may be displayed.
