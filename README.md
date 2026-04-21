# Gnomon Hero — Circular Sundial Geometry POC

Technical proof-of-concept for computing and exporting geometry for a **circular horizontal sundial** with architecture support for:

- `fixed` gnomon mode
- `movable` gnomon mode

The current UI is intentionally thin. The computational core and export pipeline are implemented first.

## What this prototype includes

- Input configuration for latitude, longitude, timezone, dial radius, north offset, style mode, hour interval, gnomon positioning mode, and export settings.
- Modular code:
  - `src/compute/*` — geometry and solar model
  - `src/render/*` — drawing scene + SVG output
  - `src/export/*` — export helpers (SVG/JSON plus optional raster/PDF code)
  - `src/config/*` — input/config handling
- Text-based sample outputs committed in repo:
  - `outputs/sample-dial.svg`
  - `outputs/sample-geometry.json`
- Minimal browser preview (`src/web/index.html`) to display generated SVG.
- Basic tests and one regression-style check.

## Install & run

```bash
npm run build:sample
npm test
npm start
```

Open `http://localhost:4173` to view the thin preview.

## Mathematical model (explicit assumptions)

### 1) Solar direction and shadow projection (defensible core)

We compute solar vector components in local horizon coordinates from latitude `phi`, declination `delta`, and solar hour angle `H`:

- `xEast = cos(delta) * sin(H)`
- `yNorth = cos(phi) * sin(delta) - sin(phi) * cos(delta) * cos(H)`
- `zUp = sin(phi) * sin(delta) + cos(phi) * cos(delta) * cos(H)`

Shadow direction on the dial plane uses the negative horizontal projection:

- `shadow = (-xEast, -yNorth)`

The shadow ray starts at the gnomon base position and is intersected with the dial circle.

### 2) Declination approximation

For day-of-year `n`, declination uses the Cooper approximation:

- `delta ≈ 23.44° * sin(2π*(284+n)/365)`

This is acceptable for a technical prototype but not ephemeris-grade astronomy.

### 3) Movable gnomon positioning used here (named approximation)

This prototype uses a **circularized analemmatic-style** displacement:

- `y_gnomon = R * cos(phi) * tan(delta)`

This formula is adapted from analemmatic sundials (normally ellipse-based) and applied to a circular plan as an explicit approximation. This is included to test architecture and export flow, not to claim final instrument precision.

## What is computed correctly vs approximate

### Computed correctly enough for this POC

- Solar-vector-based shadow direction on a horizontal plane.
- Ray/circle intersection geometry for dial boundary hits.
- Layer separation:
  - static dial circle,
  - movable gnomon markers,
  - date/month-dependent shadow lines.
- Consistent machine-readable geometry export.

### Still approximate / uncertain

- Gnomon date-position model for a **circular** dial is approximate.
- Equation of time is not applied (uses local solar-hour stepping).
- Timezone/longitude are accepted as inputs but not yet converted to civil-clock corrections in the core.
- Atmospheric refraction, solar disc size, and terrain/horizon effects are ignored.

## Map and no-map variants

- `styleMode: "without-map"` gives clean technical output.
- `styleMode: "with-map"` adds a clearly isolated map placeholder layer in render output.
- Real map integration can later replace the placeholder by injecting georeferenced raster/vector underlay before dial primitives are drawn.

## Future extension points

- Add true civil-time correction (`timezone`, `longitude`, equation-of-time).
- Add alternative gnomon models and calibrate against known sundial references.
- Add proper map tile provider integration.
- Add stronger regression suite with benchmark cases.
