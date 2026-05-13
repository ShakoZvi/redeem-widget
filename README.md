# Redeem Widget

Framework-agnostic redeem widget package for promotions and reward redemption flows.

The package is designed to be:

- reusable across multiple projects
- configurable for different backend payload shapes
- installable directly from git
- compatible with plain JavaScript hosts and React apps

## Table Of Contents

- [Why This Package](#why-this-package)
- [Installation](#installation)
- [Auto-Install Assets (postinstall)](#auto-install-assets-postinstall)
- [Quick Start (Vanilla/PHP Host)](#quick-start-vanillaphp-host)
- [Quick Start (Config App Facade)](#quick-start-config-app-facade)
- [Quick Start (React Host)](#quick-start-react-host)
- [How It Works](#how-it-works)
- [Configuration Reference](#configuration-reference)
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
- `theme`: class prefix + provider/game background maps
- `transport`: override default `fetch` transport
- `hooks`: lifecycle hooks (open, close, select, data loaded, redeem success/error)

Detailed docs:

- `docs/CONFIGURATION.md` - full reference for every config field, defaults, behavior, and examples
- `docs/THEMING.md` - CSS workflow, class reference, override recipes
- `docs/ARCHITECTURE.md` - internal data flow
- `docs/INTEGRATION_PHP.md` - PHP / `ajax()` + `handler.php` integration
- `docs/INTEGRATION_REACT.md` - React integration

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
