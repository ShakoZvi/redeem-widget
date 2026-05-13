# Release Checklist

This document describes how to cut a new release of `@redeem/widget`, what to verify before tagging, and how host projects consume updates.

---

## Pre-release verification

Run the full local check before tagging:

```bash
npm install
npm test
npm run build
```

Then manually verify:

1. `dist/redeem-widget.umd.js` exists and exposes `window.RedeemWidget` (open `dist/redeem-widget.umd.js` and grep for the global).
2. `dist/redeem-widget.esm.js` exists and matches the ESM entry in `package.json` (`exports["."].import`).
3. `dist/redeem-widget.css` is non-empty and current.
4. `dist/**/*.d.ts` were re-emitted (TypeScript types match `src/types.ts`).
5. README files (`README.md`, `README.ka.md`) reflect any new config options.
6. `docs/` is up to date — particularly `CONFIGURATION.md` and `THEMING.md` if the public API changed.

---

## Semantic versioning

Follow [SemVer](https://semver.org/):

| Bump | When |
| ---- | ---- |
| `patch` | Bug fixes, doc-only updates, internal refactors with no API changes. |
| `minor` | New config options, new exports, new optional features. Backward compatible. |
| `major` | Renamed/removed config keys, changed defaults, breaking transport/normalize contracts. |

Common public-API surfaces to watch:

- `RedeemWidgetConfig` shape
- `RedeemConfigAppConfig` shape
- `RedeemWidgetInstance` methods (`mount`, `open`, `close`, `reload`, `destroy`)
- `ThemeTokens` keys (renaming is breaking)
- `CanonicalBankPayload` (adapter contract)

---

## Versioning workflow

```bash
# bump version + create git tag
npm version patch    # or minor / major

# push branch + tags
git push --follow-tags origin main
```

`npm version` updates `package.json`, commits the change, and creates a tag like `v0.2.1`.

---

## Tagging a release manually

If you prefer manual control:

```bash
# edit package.json version field
git add package.json
git commit -m "chore(release): v0.2.1"
git tag v0.2.1
git push origin main --tags
```

---

## Git-install consumption

Host projects install the widget directly from git:

```bash
npm i git+https://github.com/ShakoZvi/redeem-widget.git
```

Or pinned to a tag/branch:

```bash
npm i git+https://github.com/ShakoZvi/redeem-widget.git#v0.2.0
npm i git+https://github.com/ShakoZvi/redeem-widget.git#main
```

When npm clones the repo into `node_modules/@redeem/widget`, it runs the `prepare` script automatically, which executes `npm run build`. This regenerates `dist/` on the consumer machine — no committed `dist/` required in the repository itself.

Right after install, the host project's own `postinstall` runs (if configured), invoking `redeem-widget-install` to copy `dist/*` into `static/assets/redeem-widget/`.

---

## Optional NPM publish

If you decide to publish to the npm registry:

```bash
npm login
npm publish --access public
```

For a scoped public package (`@redeem/widget`), `--access public` is required the first time.

Make sure `files` in `package.json` includes exactly what should ship:

```json
{
  "files": ["dist", "bin", "README.md", "README.ka.md", "LICENSE"]
}
```

---

## Release notes template

Use a consistent format in tag descriptions or GitHub Releases:

```md
## v0.2.1 (2026-05-13)

### Added
- `theme.tokens` for CSS-variable theming
- `providerBackgroundList` / `gameBackgroundList` config arrays
- `RedeemConfigApp.init` facade
- A11y: focus trap, Esc close, ARIA attributes

### Changed
- `defaultThemeConfig` now exposes a `tokens` object with sensible defaults

### Fixed
- `closeOnOverlayClick` was ignoring `ui.closeOnOverlayClick: false`

### Migration notes
- No breaking changes; existing configs continue to work.
```

---

## Rollback

If a release is broken:

1. Revert the host project's dependency to the previous git ref:
   ```json
   { "dependencies": { "@redeem/widget": "git+https://github.com/ShakoZvi/redeem-widget.git#v0.1.0" } }
   ```
2. Run `npm install` again. `postinstall` will re-copy the old `dist/`.
3. Fix forward in the widget repo; release a new patch.

Avoid deleting tags after publish; mark them as deprecated in release notes instead.

---

## CI suggestions (optional)

A minimal GitHub Actions workflow that runs on every push:

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm test
      - run: npm run build
```

Adding such a workflow ensures every git-install consumer gets a build that has been verified at least once on a clean environment.
