# Visual regression tests

Playwright pixel-diff tests that guard critical brand surfaces from
unintended visual drift.

## Run

```bash
bun run test:visual
```

Playwright starts the dev server automatically (or reuses one already
running on port 8080).

## Update baselines

After an **intentional** visual change (redesign, brand update), refresh
the committed snapshots:

```bash
bun run test:visual -- --update-snapshots
```

Commit the updated PNGs under `tests/visual/__screenshots__/`.

## What's covered

- `brandmark.spec.ts` — the home page `BrandMark` (indigo gradient "V"
  tile). Snapshotted via the `data-testid="brand-mark"` selector; a diff
  means someone edited the gradient, radius, ring, glyph, or shadow.

Add new specs alongside for other brand-critical elements (logo lockups,
favicon renders, hero mark, etc.).
