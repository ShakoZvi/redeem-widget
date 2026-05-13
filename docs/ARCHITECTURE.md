# Architecture

This document describes how `@redeem/widget` is structured internally, how data flows at runtime, and how to extend it without breaking existing hosts.

---

## Goals

- **Host-agnostic** — runs in vanilla JS, server-rendered PHP, Vite/webpack apps, and React.
- **Backend-agnostic** — adapters isolate API shape differences from business rules.
- **Composable** — every concern (rules, filters, totals, theme, transport, hooks) is a small, replaceable unit.
- **Safe defaults** — package works with zero optional config; every optional section has defaults in `core/state.ts`.

---

## Source layout

```text
src/
├── adapters/
│   └── defaultBankNormalizer.ts   # legacy → canonical mapping
├── core/
│   ├── defaultCatalog.ts          # default providers/games
│   ├── rules.ts                   # totals + render provider construction
│   └── state.ts                   # default configs and initial state
├── react/
│   └── RedeemWidget.tsx           # React wrapper (lifecycle-safe)
├── styles/
│   └── redeem-widget.css          # self-contained widget CSS
├── transports/
│   ├── ajaxTransport.ts           # legacy ajax() + handler.php helper
│   └── defaultFetchTransport.ts   # standard fetch transport
├── ui/
│   └── template.ts                # modal HTML template
├── config-app.ts                  # RedeemConfigApp facade
├── index.ts                       # package entry (exports)
├── types.ts                       # public types
└── widget.ts                      # createRedeemWidget core
```

Build outputs (`scripts/build.mjs` + `tsc`):

```text
dist/
├── redeem-widget.esm.js
├── redeem-widget.umd.js           # exposes window.RedeemWidget
├── redeem-widget.css
├── react/RedeemWidget.js          # external React deps (peer)
└── **/*.d.ts                      # TypeScript declarations
```

---

## Runtime data flow

```
host ─▶ createRedeemWidget(config)
                │
                ▼
        validateConfig(config)
                │
                ▼
        merge defaults (rules, filters, bank, ui, theme.tokens, ...)
                │
                ▼
        mount() ─▶ create shell + root DOM, apply theme tokens (CSS vars)
                │
                ▼
        loadBank() ─▶ transport.bank({ url, body: getContext() })
                │
                ▼
        normalize(raw) ─▶ CanonicalBankPayload
                │
                ▼
        rules engine ─▶ totals + active/disabled games
                │
                ▼
        UI template render ─▶ providers/games/footer
                │
                ▼
        bind events (keyboard, click, focus trap, overlay/Esc close)
                │
                ▼
        user selects game ─▶ redeem() ─▶ transport.redeem(...)
                │
                ▼
        hooks.onRedeemSuccess + reload bank
```

---

## Canonical model

The canonical model is the contract between adapters and the rules engine. Adapters map any raw payload into this shape; the engine never reads anything else.

```ts
interface CanonicalBankPayload {
  totalFreespins: number;
  games: Record<number, GameBankInfo>; // keyed by GameDefinition.typeId
}

interface GameBankInfo {
  amount: number;          // available spins/units
  em: number;              // eligibility marker (1 = eligible)
  eligibleFrsp: number;    // freespin balance availability
  massPrizeValue: number;  // tier value used by selectableMassPrizeValue
  descrpt?: string;
  vendor?: string;
}
```

`buildRenderProviders` produces `RenderProvider[]`, each containing `RenderGame[]` with `active`, `amount`, `providerType`, and the original `GameDefinition` fields.

---

## Layered responsibilities

| Layer | Files | Responsibility |
| ----- | ----- | -------------- |
| Adapter | `adapters/*` | Raw backend payload → canonical model. Pure functions, no DOM, no network. |
| Transport | `transports/*` | Network I/O abstraction. Takes `{ url, method, body }`, returns parsed payload. |
| Core | `core/rules.ts`, `core/state.ts` | Totals, eligibility, filter application, provider list assembly. Pure logic. |
| UI | `ui/template.ts` + `styles/*` | HTML rendering and CSS. No business logic; receives `RenderProvider[]`. |
| Widget | `widget.ts` | Glue: config merge, lifecycle, events, accessibility, theme tokens, redeem flow. |
| Facade | `config-app.ts` | Convenience initializer for vanilla hosts. |
| React | `react/RedeemWidget.tsx` | Lifecycle-safe wrapper around the imperative widget. |

This separation lets you:

- swap the transport without touching rules
- swap the adapter without touching UI
- swap the UI template without touching network or rules
- mount the same widget engine in any host (vanilla, React, …)

---

## Configuration merge order

```text
defaultRules    ⊕ config.rules
defaultFilters  ⊕ config.filters
defaultBank     ⊕ config.bank
defaultUI       ⊕ config.ui   (labels merged separately)
defaultTheme    ⊕ config.theme  (tokens merged separately)
```

`⊕` means "shallow merge with user-provided override". Labels and theme tokens get an extra inner-merge so partial overrides keep working.

---

## Selection persistence

`loadBank()` remembers the previously selected provider/game id and:

1. Keeps the active provider tab if it still exists (`ui.preserveActiveTab`).
2. Keeps the selected game if it still exists and is still active.
3. If `ui.autoSelectFirstActiveGame` is true, auto-picks the first active game.

This avoids losing UX state during background refreshes.

---

## Accessibility model

`widget.ts` provides:

- modal opens with focus moved inside (close button)
- `Esc` key triggers `close()` (configurable via `ui.closeOnEscape`)
- Tab/Shift+Tab keep focus within the modal (`ui.trapFocus`)
- overlay click closes modal (`ui.closeOnOverlayClick`)
- closing restores focus to the previously focused element

`ui/template.ts` adds `role="dialog"`, `aria-modal`, `aria-labelledby`, `tabindex="-1"` for screen readers.

---

## Theming model

There are three orthogonal layers, in order of precedence:

1. `theme.tokens` → applied as CSS variables on the widget shell (`--rw-modal-bg`, etc.).
2. Config-driven backgrounds:
   - `providerBackgrounds` / `providerActiveBackgrounds` / `providerBackgroundList`
   - `gameBackgrounds` / `gameBackgroundsByClass` / `gameBackgroundList`
3. Host CSS overrides loaded after the package stylesheet.

`theme.classPrefix` renames every emitted class (`rw-*` → `<prefix>-*`).

---

## Extension strategies

### Add a new backend format

1. Create `src/adapters/<name>.ts`.
2. Map raw fields → `CanonicalBankPayload`.
3. Add JSON fixture in `tests/fixtures/`.
4. Add a vitest spec in `tests/`.
5. Hand the adapter to `config.normalize`.

### Add a new provider/game

- Catalog can live in your host code; pass via `config.providers` / `config.games`.
- Ensure `game.typeId` matches the numeric key your backend uses.

### Add a new transport

1. Implement `(request) => Promise<unknown>`.
2. Pass via `config.transport`.
3. Optional: ship as a helper like `createAjaxTransport`.

### Extend theming

- Add new tokens in `ThemeTokens` and default values in `defaultThemeConfig.tokens`.
- Add the matching `--rw-*` CSS variable in `styles/redeem-widget.css`.
- Add it to `applyThemeTokens()` in `widget.ts`.

---

## Build & types

- `scripts/build.mjs` bundles ESM and UMD via esbuild.
- `tsc -p tsconfig.json --emitDeclarationOnly` produces `.d.ts` files.
- `prepare` runs `npm run build` automatically when consumers install from git, so no committed `dist/` is needed.

---

## Tests

Current test surface:

- `tests/default-bank-normalizer.test.ts` — adapter mapping correctness.
- `tests/rules.test.ts` — total computation and provider list assembly.

Recommended next steps:

- Add DOM-level integration tests via `@testing-library/dom`.
- Add Playwright smoke for keyboard + redeem happy path.
- Add visual regression snapshots once theming stabilizes.
