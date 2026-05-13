# Redeem Widget

A plug-and-play redeem experience for promo and reward flows — designed once, reusable everywhere.

`@redeem/widget` ships the complete logic of a freespin / prize redeem modal as a single installable package: bank fetch, eligibility rules, provider/game catalogs, self-rendered UI, theming, and post-redeem refresh. Host projects only describe their backend and brand; the widget handles the rest.

**Highlights**

- Drop into any host — vanilla HTML, legacy PHP, modern bundlers, or React.
- One config to control endpoints, rules, filters, totals, UX, theme, and hooks.
- Backend-agnostic: pluggable transports (`fetch`, `ajax()` + `handler.php`, custom) and normalizers.
- Self-rendered, accessible modal with focus trap, `Esc` close, and overlay dismissal.
- Modern theming via CSS variables (`theme.tokens`) and per-provider/per-game background config.
- Installable straight from git — every `npm install` keeps host assets in sync via the `redeem-widget-install` CLI.

## Table Of Contents

- [Why This Package](#why-this-package)
- [Installation](#installation)
- [Auto-Install Assets (postinstall)](#auto-install-assets-postinstall)
- [Quick Start (Vanilla/PHP Host)](#quick-start-vanillaphp-host)
- [Quick Start (Config App Facade)](#quick-start-config-app-facade)
- [Quick Start (React Host)](#quick-start-react-host)
- [How It Works](#how-it-works)
- [Configuration Reference](#configuration-reference)
- [Configuration Guide (Step-by-Step)](#configuration-guide-step-by-step)
- [Adapters And Normalization](#adapters-and-normalization)
- [Custom Transport](#custom-transport)
- [Accessing Backend Response Data](#accessing-backend-response-data)
- [Theming & CSS Customization](#theming--css-customization)
- [Built-in UX And Accessibility](#built-in-ux-and-accessibility)
- [Development](#development)
- [Testing](#testing)
- [Security Notes](#security-notes)
- [Roadmap](#roadmap)
- [License](#license)

## Why This Package

Most redeem implementations repeat the same logic:

- bank data fetch
- business rules (eligibility, affordability, min amount)
- provider/game rendering
- redemption request
- post-redeem refresh

This package centralizes that flow while keeping backend and UI integration configurable.

## Installation

Install directly from your git repository:

```bash
npm i git+https://github.com/ShakoZvi/redeem-widget.git
```

This repository is public and can be installed directly from GitHub.
The package import name is:

```bash
@redeem/widget
```

Note: `@redeem/widget` is the package name used in imports.  
If you have not published to npm, installation should use the GitHub URL shown above.

## Auto-Install Assets (postinstall)

For non-bundler hosts (plain PHP / vanilla HTML pages), the package ships a small CLI
that copies built assets (`redeem-widget.umd.js`, `redeem-widget.umd.js.map`, `redeem-widget.css`)
into a folder of your choice (typically `static/assets/redeem-widget/`).

Add it to your host project's `package.json`:

```json
{
  "scripts": {
    "postinstall": "redeem-widget-install static/assets/redeem-widget"
  }
}
```

Now every `npm install` (and any future package update) keeps your asset folder in sync.

In your HTML you only need:

```html
<link rel="stylesheet" href="static/assets/redeem-widget/redeem-widget.css">
<script src="static/assets/redeem-widget/redeem-widget.umd.js"></script>
```

The UMD bundle exposes everything under the global `window.RedeemWidget`.

### Optional: auto-manage `.gitignore`

When the host project is PHP-served (Node not available on production), the recommended setup is:

- **`node_modules/`** → gitignored (never commit)
- **`package.json` + `package-lock.json`** → committed (reproducible installs)
- **`static/assets/redeem-widget/`** → committed (production PHP serves these files)

The CLI can do the gitignore step for you. Pass `--ensure-gitignore` (or `-g`):

```json
{
  "scripts": {
    "postinstall": "redeem-widget-install static/assets/redeem-widget --ensure-gitignore"
  }
}
```

This appends an **idempotent managed block** to your `.gitignore`:

```text
# >>> @redeem/widget managed-block (do not edit by hand) >>>
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.npm/
# <<< @redeem/widget managed-block <<<
```

Running it again is safe — the block is detected and **not duplicated**. Without the flag the CLI just prints a short hint after copying. Add `--silent` (`-s`) for quiet CI runs.

Full guide and the alternative "gitignore the asset folder too" pattern: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Quick Start (Vanilla/PHP Host)

After installation and `postinstall` copies the assets, put this in your page:

```html
<button id="open-redeem" type="button">Redeem</button>
<div id="redeem-widget-root"></div>

<link rel="stylesheet" href="static/assets/redeem-widget/redeem-widget.css">
<script src="static/assets/redeem-widget/redeem-widget.umd.js"></script>

<script>
  (function () {
    var rw = window.RedeemWidget;

    var widget = rw.createRedeemWidget({
      endpoints: {
        // For projects routing requests through ajax() + handler.php,
        // pass only the file name as it lives inside WebServices/.
        bank: "redeem_bank.php",
        redeem: "user_redeem.php",
      },
      getContext: function () {
        return {
          user_id: document.body.dataset.userId,
          userHash: document.body.dataset.userHash,
        };
      },
      normalize: rw.defaultBankNormalizer,
      providers: rw.defaultProviders,
      games: rw.defaultGames,
      transport: rw.createAjaxTransport({
        ajax: window.ajax,
        requestType: "post",
        async: true,
        custom: true,
      }),
    });

    widget.mount("#redeem-widget-root");

    var openBtn = document.querySelector("#open-redeem");
    if (openBtn) {
      openBtn.addEventListener("click", function () { widget.open(); });
    }
  })();
</script>
```

If your build pipeline supports ES modules (Vite/webpack), the import-based variant also works:

```ts
import {
  createRedeemWidget,
  createAjaxTransport,
  defaultBankNormalizer,
  defaultGames,
  defaultProviders,
} from "@redeem/widget";
import "@redeem/widget/styles.css";
```

## Quick Start (React Host)

```tsx
import { RedeemWidget } from "@redeem/widget/react";
import "@redeem/widget/styles.css";

export function RedeemModal({ isOpen, config }) {
  return <RedeemWidget config={config} isOpen={isOpen} />;
}
```

## Quick Start (Config App Facade)

For legacy PHP pages you can use a single high-level initializer:

```html
<button id="open-redeem" type="button">Redeem</button>
<div id="redeem-widget-root"></div>

<link rel="stylesheet" href="static/assets/redeem-widget/redeem-widget.css">
<script src="static/assets/redeem-widget/redeem-widget.umd.js"></script>

<script>
  window.RedeemWidget.RedeemConfigApp.init({
    endpoint: "redeem_bank.php",
    redeemEndpoint: "user_redeem.php",
    mountTo: "#redeem-widget-root",
    openButtonSelector: "#open-redeem",
    getContext: function () {
      return {
        user_id: document.body.dataset.userId,
        userHash: document.body.dataset.userHash,
      };
    },
    normalize: window.RedeemWidget.defaultBankNormalizer,
    providers: window.RedeemWidget.defaultProviders,
    games: window.RedeemWidget.defaultGames,
    transport: window.RedeemWidget.createAjaxTransport({
      ajax: window.ajax,
      requestType: "post",
      async: true,
      custom: true,
    }),
  });
</script>
```

## How It Works

1. Host calls `createRedeemWidget(config)`.
2. Widget mounts into container and self-renders UI.
3. Widget calls `endpoints.bank` with payload from `getContext()`.
4. `normalize()` maps response to canonical model.
5. Rules engine computes active/disabled games and totals.
6. User selects game and clicks redeem.
7. Widget calls `endpoints.redeem` and reloads bank state.

## Configuration Reference

`createRedeemWidget(config)` accepts:

- `endpoints.bank`: bank endpoint URL
- `endpoints.redeem`: redeem endpoint URL
- `getContext()`: returns payload merged into requests (user/session/hash/etc.)
- `normalize(raw)`: maps backend payload into canonical format
- `providers`: provider catalog
- `games`: game catalog
- `rules`: business rules (`minAmountToEnable`, eligibility/affordability, etc.)
- `filters`: provider/game visibility filters
- `bank`: amount calculation settings (`unitValue`, precision, total mode)
- `ui`: labels and UX behavior (tab persistence, auto-select, keyboard/overlay close)
- `theme`: class prefix, design tokens (`theme.tokens`), and provider/game background maps
- `transport`: override default `fetch` transport
- `hooks`: lifecycle hooks (open, close, select, data loaded, redeem success/error)

Detailed docs:

- `docs/CONFIGURATION.md` - full reference for every config field, defaults, behavior, and examples
- `docs/THEMING.md` - CSS workflow, class reference, override recipes
- `docs/ARCHITECTURE.md` - internal data flow
- `docs/INTEGRATION_PHP.md` - PHP / `ajax()` + `handler.php` integration
- `docs/INTEGRATION_REACT.md` - React integration
- `docs/DEPLOYMENT.md` - git/gitignore workflow + PHP deployment patterns
- `docs/COMPATIBILITY.md` - React & Node.js compatibility matrix
- `docs/SECURITY.md` - security boundary and recommendations
- `docs/RELEASE.md` - release checklist and versioning

## Configuration Guide (Step-by-Step)

This section is a practical playbook: how to assemble a working config from zero, in what order, and what every field does. Use it together with `docs/CONFIGURATION.md` for the full reference.

### Two ways to initialize the widget

| Approach | When to use it |
| -------- | -------------- |
| `createRedeemWidget(config)` | You want full control: mount container, bind your own buttons, call `open()`/`close()` yourself. |
| `RedeemConfigApp.init(config)` | Legacy/vanilla pages: shorthand endpoints, optional auto-mount, optional `openButtonSelector`. |

Both accept the same logical options. `RedeemConfigApp.init` adds convenience fields (`endpoint`, `redeemEndpoint`, `mountTo`, `openButtonSelector`, `autoMount`, `openOnInit`) and maps them to `createRedeemWidget` internally.

---

### Step 0 — Prerequisites on the host page

Before writing config, ensure:

1. **CSS and JS are loaded** (UMD example):

   ```html
   <link rel="stylesheet" href="static/assets/redeem-widget/redeem-widget.css">
   <script src="static/assets/redeem-widget/redeem-widget.umd.js"></script>
   ```

2. **A mount container exists** in the DOM (for example `<div id="redeem-widget-root"></div>`). The widget renders inside this element.

3. **Your backend contract is known**: which PHP (or API) file returns bank data, which performs redeem, and what JSON shape they return.

4. **If you use `ajax()` + `handler.php`**: `window.ajax` must exist before init, and endpoint strings must be **bare filenames** (for example `redeem_bank.php`), not paths like `/WebServices/redeem_bank.php`.

---

### Step 1 — Choose required fields (minimum viable config)

Every working config must provide:

| Field | Purpose |
| ----- | ------- |
| `endpoints.bank` | Where to load bank state (or `endpoint` when using `RedeemConfigApp.init`). |
| `endpoints.redeem` | Where to submit redeem (or `redeemEndpoint` with the facade). |
| `getContext` | Function returning an object merged into **every** request body (user id, hash, locale, etc.). |
| `normalize` | Function that converts your bank response into the canonical internal model. |
| `providers` | Array of provider definitions (tabs). You can start with `defaultProviders`. |
| `games` | Array of game definitions (catalog). You can start with `defaultGames`. |

Optional but common in PHP stacks:

| Field | Purpose |
| ----- | ------- |
| `transport` | Use `createAjaxTransport({ ajax: window.ajax, ... })` instead of default `fetch`. |

Everything else (`rules`, `filters`, `bank`, `ui`, `theme`, `hooks`) layers behavior and UX on top.

---

### Step 2 — Endpoints (`endpoints` or facade aliases)

**`endpoints.bank`** (string)

- With **default `fetch` transport**: use a full URL path your server exposes (for example `/api/redeem/bank`).
- With **`createAjaxTransport` + `handler.php`**: use only the WebService **filename** (for example `redeem_bank.php`). The handler resolves it relative to `WebServices/` and rejects invalid paths.

**`endpoints.redeem`** (string)

- Same rules as `bank`: full URL with `fetch`, filename only with `ajax()` + handler.

**Facade shorthand** (`RedeemConfigApp.init` only)

- `endpoint` → same as `endpoints.bank`
- `redeemEndpoint` → same as `endpoints.redeem`

You can still pass `endpoints: { bank, redeem }` explicitly if you prefer.

---

### Step 3 — Context (`getContext`)

**Type:** `() => Record<string, unknown> | Promise<Record<string, unknown>>`

**What it does:** The returned object is **spread/merged** into the body of both bank and redeem requests (together with any extra fields the transport adds).

**Typical PHP host:**

```js
getContext: function () {
  return {
    user_id: document.body.dataset.userId,
    userHash: document.body.dataset.userHash,
  };
},
```

**Rules of thumb:**

- Never hardcode secrets in `getContext`.
- Keys must match what your WebService expects (`user_id`, `userHash`, etc.).
- If you need async session lookup, return a `Promise` from `getContext`.

---

### Step 4 — Normalization (`normalize`)

**Type:** `(raw: unknown) => CanonicalBankPayload`

**What it does:** Your bank endpoint can return any JSON shape. The widget only understands the **canonical** model:

```ts
{
  totalFreespins: number;
  games: Record<number, {
    amount: number;
    em: number;
    eligibleFrsp: number;
    massPrizeValue: number;
    descrpt?: string;
    vendor?: string;
  }>;
}
```

**Built-ins:**

- `defaultBankNormalizer` — legacy `{ data, total_freespins }`-style payloads.
- `canonicalBankNormalizer` — already-canonical payloads.

**Custom:** Implement your own function that reads `raw` and returns the object above. You can wrap the default:

```js
normalize: function (raw) {
  if (raw && raw.customFlag) {
    return myCustomMapper(raw);
  }
  return rw.defaultBankNormalizer(raw);
},
```

---

### Step 5 — Catalogs (`providers` and `games`)

**`providers: ProviderDefinition[]`**

Each provider becomes a tab (unless filtered out).

| Property | Required | Description |
| -------- | -------- | ----------- |
| `id` | yes | Stable string id. Referenced by games via `providerId`. |
| `name` | yes | Label shown on the tab button. |
| `type` | yes | `"freespin"` \| `"tableGames"` \| `"cashPrize"` — used internally for typing. |
| `active` | no | Optional visibility flag in catalog. |
| `sortOrder` | no | Lower sorts first among non-popular providers. |

If you omit a provider with `id: "popular"`, the package **auto-injects** a synthetic popular tab (see `resolveProviders` in source).

**`games: GameDefinition[]`**

Each game is one selectable row when its provider tab is active.

| Property | Required | Description |
| -------- | -------- | ----------- |
| `id` | yes | Unique id for selection and for `theme.gameBackgrounds`. |
| `typeId` | yes | **Must match** the numeric key in `CanonicalBankPayload.games` from the bank response. |
| `providerId` | yes | Must match a `ProviderDefinition.id`. |
| `imgClass` | yes | CSS class on the image span; also used by `theme.gameBackgroundsByClass`. |
| `value` | yes | Nominal value shown as `{value}₾` in the UI. |
| `label` | no | Optional display override. |

---

### Step 6 — Transport (`transport`)

**Default:** browser `fetch` POST with JSON body.

**PHP legacy:** `createAjaxTransport({ ajax: window.ajax, requestType: "post", async: true, custom: true })` keeps your existing `ajax()` → `handler.php` → WebService pipeline.

**Custom:** Any async function `(request) => unknown` where `request` has `{ url, method?, body? }`.

---

### Step 7 — Rules (`rules`, all optional with defaults)

Merged with defaults from the package. Controls **which games are clickable** (`active`).

| Field | Default | Meaning |
| ----- | ------- | ------- |
| `selectableMassPrizeValue` | `null` | If set to a number, only games whose bank `massPrizeValue` matches (within float tolerance) can be selected. |
| `minAmountToEnable` | `1` | Game disabled if `amount < minAmountToEnable`. |
| `requireAffordableBalance` | `true` | If `true`, game disabled when `game.value > totalAmount` (total amount derived from freespins × `bank.unitValue`). |
| `requireEligibleFrsp` | `false` | If `true`, also requires `eligibleFrsp === 1` from bank data. |

**`active` computation (simplified):** a game is active when bank `em === 1` and all enabled rules above pass.

---

### Step 8 — Filters (`filters`, optional)

Controls **what appears** in lists after rules are evaluated.

| Field | Default | Meaning |
| ----- | ------- | ------- |
| `hideGamesWithoutApi` | `true` | Hide catalog games that have no matching `typeId` entry in the bank payload. |
| `hideZeroAmountGames` | `false` | Hide games with `amount === 0`. |
| `hideProvidersWithoutGames` | `true` | Hide provider tabs that would have zero visible games. |

---

### Step 9 — Bank totals (`bank`, optional)

| Field | Default | Meaning |
| ----- | ------- | ------- |
| `totalFreespinsMode` | `"response"` | `"response"` — use `payload.totalFreespins` from normalizer. `"sumAll"` — sum all `amount` values. `"sumByMassPrizeValue"` — sum amounts filtered by `rules.selectableMassPrizeValue` when set. |
| `unitValue` | `0.15` | Currency value per freespin unit; used to compute `totalAmount` for affordability checks. |
| `precision` | `2` | Decimal places for derived totals. |

---

### Step 10 — UI behavior and labels (`ui`, optional)

**Behavior flags**

| Field | Default | Meaning |
| ----- | ------- | ------- |
| `popularSlice` | `7` | Max number of games in the auto-generated **Popular** tab. |
| `preserveActiveTab` | `true` | After bank reload, keep the same provider tab if it still exists. |
| `clearSelectedGameOnProviderChange` | `true` | When user switches provider tab, clear selected game. |
| `autoSelectFirstActiveGame` | `false` | After load, auto-select first active game in the current tab. |
| `closeOnOverlayClick` | `true` | Click outside modal (overlay) closes. |
| `closeOnEscape` | `true` | `Escape` closes modal. |
| `trapFocus` | `true` | Keep keyboard focus inside the modal while open. |

**`labels`**

| Key | Default | Where it appears |
| --- | ------- | ---------------- |
| `title` | `"Redeem"` | Dialog accessible name / header. |
| `popular` | `"Popular Games"` | Name of injected popular tab. |
| `redeem` | `"Redeem"` | Primary button. |
| `close` | `"Close"` | Close button (also used for a11y label on icon-style close). |
| `emptyValue` | `"--"` | Footer when no game selected. |

---

### Step 11 — Theme (`theme`, optional)

**`classPrefix`** (default `"rw"`)

- Prefix for all widget CSS classes (`rw-modal`, `rw-game`, ...). State classes (`is-open`, `is-active`, ...) are not prefixed.

**`tokens`** (partial `ThemeTokens`)

- Key-value map of design tokens applied as **CSS custom properties** on the widget shell (for example `--rw-modal-bg`). See `src/core/state.ts` for the full default token set.
- Use this for fast rebranding without editing package CSS.

**Provider / game images via config**

- `providerBackgrounds`, `providerActiveBackgrounds` — maps `providerId` → any valid CSS `background` shorthand.
- `gameBackgrounds`, `gameBackgroundsByClass` — maps `game.id` or `imgClass` → CSS `background`.
- `providerBackgroundList`, `gameBackgroundList` — array form for dynamic configs.

**Game background resolution order**

1. `theme.gameBackgrounds[game.id]`
2. `theme.gameBackgroundList` entry with matching `gameId`
3. `theme.gameBackgroundsByClass[game.imgClass]`
4. `theme.gameBackgroundList` entry with matching `imgClass`
5. Built-in CSS / host overrides

---

### Step 12 — Hooks (`hooks`, optional)

| Hook | When it runs |
| ---- | ------------ |
| `onOpen` | Modal opened (`open()`). |
| `onClose` | Modal closed (`close()` or overlay/Esc). |
| `onSelect` | User picked a game (after click). |
| `onDataLoaded` | After bank response normalized; receives `CanonicalBankPayload`. |
| `onRedeemSuccess` | After redeem transport resolves successfully. |
| `onRedeemError` | Redeem throws or rejects. |

Use hooks to sync external DOM (totals, toasts) without forking the widget.

---

### Step 13 — Widget instance API (after init)

| Method | Use |
| ------ | --- |
| `mount(selectorOrElement)` | Attach widget DOM (if not using `RedeemConfigApp` auto-mount). |
| `open()` | Show modal (starts visible shell state; bank may already be loading from mount). |
| `close()` | Hide modal. |
| `reload()` | Re-fetch bank data. |
| `destroy()` | Remove DOM and listeners. |

**`RedeemConfigApp` extras**

| Method / option | Meaning |
| ---------------- | ------- |
| `init(config)` | Creates widget, mounts unless `autoMount: false`, binds `openButtonSelector`. |
| `getInstance()` | Returns current instance or `null`. |
| `destroy()` | Destroys instance and open-button listener. |
| `mountTo` | Selector or element for mount (default `#redeem-widget-root`). |
| `openButtonSelector` | CSS selector; click calls `open()`. |
| `autoMount` | Default `true`. Set `false` if you call `mount()` yourself. |
| `openOnInit` | If `true`, opens modal immediately after init. |

---

### Step 14 — Runtime validation errors

`createRedeemWidget` validates the minimal shape at startup and throws clear errors if:

- `endpoints.bank` / `endpoints.redeem` missing
- `getContext`, `normalize` not functions
- `providers` / `games` not arrays

Fix the error message literally: it points to the missing or wrong field.

---

### Step 15 — End-to-end checklist before going live

1. Open DevTools **Network**: bank request returns 200 and JSON your `normalize` understands.
2. **Console**: no uncaught exceptions during `init` / `mount`.
3. Click **Redeem** (or call `open()`): modal appears, focus moves inside.
4. Select a game: footer updates; **Redeem** enables when rules allow.
5. Submit redeem: success hook runs; bank reloads; modal closes (default redeem flow closes after success in widget code — adjust hooks if you need different UX).

---

### Recommended order when copying a config from another project

1. Copy `endpoints` (or facade `endpoint` / `redeemEndpoint`).
2. Copy `getContext` keys to match your backend.
3. Confirm `normalize` matches your bank JSON (use `hooks.onDataLoaded` to log canonical payload once).
4. Align `games[].typeId` with bank keys.
5. Tune `rules` / `filters` / `bank` to match promo rules.
6. Add `theme.tokens` and/or background maps for branding.
7. Add `hooks` for analytics and external UI sync.

## Adapters And Normalization

The package separates backend shape from widget logic:

- `defaultBankNormalizer`: maps legacy `data + total_freespins` style responses
- `canonicalBankNormalizer`: accepts already-canonical payloads

Canonical payload shape:

```ts
{
  totalFreespins: number;
  games: Record<number, {
    amount: number;
    em: number;
    eligibleFrsp: number;
    massPrizeValue: number;
  }>
}
```

## Custom Transport

By default the widget uses `fetch`, but examples below are ordered by practical usage.

### 1) ajax() + handler.php flow (recommended for legacy PHP stacks)

```ts
transport: rw.createAjaxTransport({
  ajax: window.ajax,
  requestType: "post",
  async: true,
  custom: true,
});
```

Important: when using `ajax()` + `handler.php`, `endpoints.bank` and `endpoints.redeem`
must be the bare WebService file names (for example `redeem_bank.php`), not URL paths.
`handler.php` resolves the file relative to its own directory and rejects unknown paths
with `Web service wrapper error: the ws file path is not valid!`.

### 2) Fully custom transport function

```ts
transport: async ({ url, method, body }) => {
  const response = await legacyAjaxClient(url, method, body);
  return response;
};
```

## Accessing Backend Response Data

You can access backend response data in three places:

1. `normalize(raw)` - raw bank endpoint response.
2. `hooks.onDataLoaded(payload)` - normalized canonical bank payload.
3. `hooks.onRedeemSuccess(response, game)` - redeem endpoint response.

```ts
const widget = rw.createRedeemWidget({
  // ...
  normalize: function (raw) {
    console.log("RAW BANK RESPONSE:", raw);
    return rw.defaultBankNormalizer(raw);
  },
  hooks: {
    onDataLoaded: function (payload) {
      var totalEl = document.querySelector(".totalFreespins");
      if (totalEl) totalEl.textContent = String(payload.totalFreespins);
    },
    onRedeemSuccess: function (response, game) {
      console.log("REDEEM RESPONSE:", response, "GAME:", game);
    },
  },
});
```

## Theming & CSS Customization

The widget ships a single self-contained stylesheet at `dist/redeem-widget.css`. From a host project you have two ways to style it without forking.

### Config-driven provider/game backgrounds

You can set vendor (provider) and game backgrounds directly from widget config, without writing separate CSS selectors.

### Theme tokens (modern theming via CSS variables)

You can theme the full widget palette/shape using `theme.tokens`:

```js
theme: {
  tokens: {
    modalBackground: "#101a33",
    modalBorderColor: "#2b3f75",
    textColor: "#f5f7ff",
    providerBackground: "linear-gradient(180deg, #2f364d 0%, #1c2130 100%)",
    providerActiveBackground: "linear-gradient(180deg, #6d52b5 0%, #2f1b4f 100%)",
    gameBackground: "#2f3447",
    gameSelectedBackground: "linear-gradient(180deg, #16a34a 0%, #0f3d24 100%)",
    footerBackground: "linear-gradient(269deg, #141a2a 24%, #2d3345 100%)",
    selectionBackground: "linear-gradient(174deg, #1b1c2c 15%, #036036 120%)",
    actionPrimaryBackground: "#16a34a",
    actionPrimaryHoverBackground: "#15803d",
    borderRadiusSm: "6px",
    borderRadiusMd: "10px",
    borderRadiusLg: "14px",
  },
}
```

```js
var widget = rw.createRedeemWidget({
  // ...
  theme: {
    classPrefix: "rw",

    // provider.id -> CSS background value
    providerBackgrounds: {
      popular: "linear-gradient(159.58deg, #343748 12.59%, #161721 75.9%)",
      pragmatic: "url('/static/assets/redeem/providers/pragmatic.webp') center / cover no-repeat",
      egt: "url('/static/assets/redeem/providers/egt.webp') center / cover no-repeat",
    },

    // optional active-state override per provider.id
    providerActiveBackgrounds: {
      pragmatic: "linear-gradient(180deg, #8c5ca3 4.73%, #2c1731 89.51%)",
      egt: "linear-gradient(170.34deg, #a33262 -1.11%, #2f1d3a 87.61%)",
    },

    // game.id -> CSS background value (highest priority)
    gameBackgrounds: {
      gatesOfOlympus: "url('/static/assets/redeem/games/gates.webp') center / cover no-repeat",
      sweetBonanza: "url('/static/assets/redeem/games/sweet.webp') center / cover no-repeat",
    },

    // fallback by GameDefinition.imgClass
    gameBackgroundsByClass: {
      burningHot: "url('/static/assets/redeem/games/burning-hot.webp') center / cover no-repeat",
    },
  },
});
```

If you prefer arrays (easy to build dynamically from backend/config files), use:

```js
theme: {
  classPrefix: "rw",
  providerBackgroundList: [
    {
      providerId: "pragmatic",
      background: "url('/static/assets/redeem/providers/pragmatic.webp') center / cover no-repeat",
      activeBackground: "linear-gradient(180deg, #8c5ca3 4.73%, #2c1731 89.51%)",
    },
    {
      providerId: "egt",
      background: "url('/static/assets/redeem/providers/egt.webp') center / cover no-repeat",
    },
  ],
  gameBackgroundList: [
    {
      gameId: "gatesOfOlympus",
      background: "url('/static/assets/redeem/games/gates.webp') center / cover no-repeat",
    },
    {
      imgClass: "burningHot",
      background: "url('/static/assets/redeem/games/burning-hot.webp') center / cover no-repeat",
    },
  ],
}
```

Priority for game image backgrounds:

1. `theme.gameBackgrounds[game.id]`
2. `theme.gameBackgroundList` entry by `gameId`
3. `theme.gameBackgroundsByClass[game.imgClass]`
4. `theme.gameBackgroundList` entry by `imgClass`
5. default CSS from `redeem-widget.css` (or your host overrides)

### A) Override from the host project

Load `redeem-widget.css` first, then a project-specific stylesheet later in the HTML:

```html
<link rel="stylesheet" href="static/assets/redeem-widget/redeem-widget.css">
<link rel="stylesheet" href="static/assets/css/redeem-overrides.css">
```

```css
/* redeem-overrides.css */
.rw-modal     { background: #0e1424; border-radius: 16px; }
.rw-redeem    { background: #f59e0b; color: #1f2937; }
.rw-game.is-selected { border-color: #f59e0b; }
```

### B) Rename the class prefix

If `rw-` collides with existing CSS:

```js
createRedeemWidget({
  // ...
  theme: { classPrefix: "redeem" },
});
```

Now every class becomes `redeem-*`.

> Full class list, data attributes, and override patterns: `docs/THEMING.md`.

## Full Config Example (ui/rules/filters/bank + theme backgrounds)

If you prefer a single readable config object (similar to `window.RedeemConfigApp.init({...})` style), use this structure:

```js
var redeemConfig = {
  endpoints: {
    bank: "fs_bank.php",
    redeem: "user_redeem.php",
  },
  getContext: function () {
    return {
      user_id: document.body.dataset.userId,
      userHash: document.body.dataset.userHash,
    };
  },
  normalize: rw.defaultBankNormalizer,
  providers: rw.defaultProviders,
  games: rw.defaultGames,
  transport: rw.createAjaxTransport({
    ajax: window.ajax,
    requestType: "post",
    async: true,
    custom: true,
  }),
  ui: {
    popularSlice: 7,
    preserveActiveTab: true,
    clearSelectedGameOnProviderChange: true,
    autoSelectFirstActiveGame: false,
    closeOnOverlayClick: true,
    closeOnEscape: true,
    trapFocus: true,
    labels: {
      title: "Redeem",
      popular: "Popular Games",
      redeem: "Redeem",
      close: "Close",
      emptyValue: "--",
    },
  },
  rules: {
    selectableMassPrizeValue: null,
    minAmountToEnable: 1,
    requireAffordableBalance: true,
    requireEligibleFrsp: false,
  },
  filters: {
    hideGamesWithoutApi: true,
    hideZeroAmountGames: false,
    hideProvidersWithoutGames: true,
  },
  bank: {
    totalFreespinsMode: "response",
    unitValue: 0.15,
    precision: 2,
  },
  theme: {
    classPrefix: "rw",
    providerBackgrounds: {
      pragmatic: "url('/static/assets/redeem/providers/pragmatic.webp') center / cover no-repeat",
    },
    providerActiveBackgrounds: {
      pragmatic: "linear-gradient(180deg, #8c5ca3 4.73%, #2c1731 89.51%)",
    },
    gameBackgrounds: {
      gatesOfOlympus: "url('/static/assets/redeem/games/gates.webp') center / cover no-repeat",
    },
    gameBackgroundsByClass: {
      burningHot: "url('/static/assets/redeem/games/burning-hot.webp') center / cover no-repeat",
    },
  },
};

var widget = rw.createRedeemWidget(redeemConfig);
widget.mount("#redeem-widget-root");
```

## Built-in UX And Accessibility

By default the widget ships with modern modal behavior:

- `Esc` closes the modal (`ui.closeOnEscape`)
- overlay click closes modal (`ui.closeOnOverlayClick`)
- keyboard focus stays inside the modal while open (`ui.trapFocus`)
- active provider tab can persist across reloads (`ui.preserveActiveTab`)

All of these behaviors are configurable through `ui`.

## Development

```bash
npm install
npm run build
```

Build output:

- `dist/redeem-widget.esm.js`
- `dist/redeem-widget.umd.js`
- `dist/redeem-widget.css`
- Type declarations (`dist/**/*.d.ts`)

## Testing

```bash
npm test
```

Current test coverage includes:

- normalization behavior
- core rules engine behavior

## Security Notes

- Do not commit secrets, keys, tokens, or personal user data in examples/tests.
- Keep `getContext()` values runtime-driven from host app, not hardcoded.
- Validate server-side authorization for redeem actions (widget-side checks are UX only).

Additional notes in `docs/SECURITY.md`.

## Roadmap

- richer theming API
- optional external trigger binding utility
- expanded fixtures for multiple backend contracts
- broader integration examples

## License

MIT
